import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, parseISO, isSameDay, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  patientName: string;
  doctorId: string;
  date: string;
  time: string;
  status: string;
}

interface OfficeAssignment {
  id: string;
  officeId: string;
  officeName: string;
  doctorId: string;
  doctorName: string;
  month: number;
  year: number;
  weekDays: number[];
  startTime: string;
  endTime: string;
  createdAt: Date;
}

interface WeeklyCalendarProps {
  doctorId: string;
  officeAssignments: OfficeAssignment[];
  appointments: Appointment[];
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    slots.push(timeStr);
  }
  
  return slots;
}

export function WeeklyCalendar({
  doctorId,
  officeAssignments,
  appointments,
  onSelectSlot,
  selectedDate,
  selectedTime
}: WeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    if (selectedDate) {
      const date = parseISO(selectedDate);
      return startOfWeek(date, { weekStartsOn: 1 });
    }
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  const [jumpToDate, setJumpToDate] = useState("");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekEnd = weekDays[6];

  // Get all unique time slots from doctor's assignments for the current week
  const getAllTimeSlots = (): string[] => {
    const allSlots = new Set<string>();
    
    officeAssignments
      .filter(assignment => assignment.doctorId === doctorId)
      .forEach(assignment => {
        const slots = generateTimeSlots(assignment.startTime, assignment.endTime);
        slots.forEach(slot => allSlots.add(slot));
      });

    return Array.from(allSlots).sort();
  };

  const timeSlots = getAllTimeSlots();

  // Check if a specific slot is available for a given date
  const getSlotStatus = (date: Date, time: string): 'available' | 'occupied' | 'unavailable' | 'completed' => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Check if date is in the past
    const today = startOfDay(new Date());
    const slotDate = startOfDay(date);
    if (isBefore(slotDate, today)) {
      return 'unavailable';
    }

    // Check if doctor has assignment for this day/time
    const hasAssignment = officeAssignments.some(assignment =>
      assignment.doctorId === doctorId &&
      assignment.month === month &&
      assignment.year === year &&
      assignment.weekDays.includes(dayOfWeek)
    );

    if (!hasAssignment) {
      return 'unavailable';
    }

    // Check if slot is within assignment time range
    const validAssignments = officeAssignments.filter(assignment =>
      assignment.doctorId === doctorId &&
      assignment.month === month &&
      assignment.year === year &&
      assignment.weekDays.includes(dayOfWeek)
    );

    const isInTimeRange = validAssignments.some(assignment => {
      const slots = generateTimeSlots(assignment.startTime, assignment.endTime);
      return slots.includes(time);
    });

    if (!isInTimeRange) {
      return 'unavailable';
    }

    // Check if there's an existing appointment (excluding cancelled ones)
    const existingAppointment = appointments.find(
      apt => apt.doctorId === doctorId && apt.date === dateStr && apt.time === time && apt.status !== 'cancelada'
    );

    if (existingAppointment) {
      return existingAppointment.status === 'completada' ? 'completed' : 'occupied';
    }

    return 'available';
  };


  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleJumpToDate = () => {
    if (jumpToDate) {
      const date = parseISO(jumpToDate);
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
      setJumpToDate("");
    }
  };

  const handleSlotClick = (date: Date, time: string) => {
    const status = getSlotStatus(date, time);
    if (status === 'available') {
      const dateStr = format(date, 'yyyy-MM-dd');
      onSelectSlot(dateStr, time);
    }
  };

  const isSelected = (date: Date, time: string): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateStr === selectedDate && time === selectedTime;
  };

  const getSlotClassName = (date: Date, time: string): string => {
    const status = getSlotStatus(date, time);
    const selected = isSelected(date, time);
    
    const baseClasses = "h-12 text-xs rounded-md border transition-all";
    
    if (selected) {
      return `${baseClasses} bg-primary text-primary-foreground border-primary ring-2 ring-primary/50`;
    }
    
    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-500 hover:bg-green-600 text-white cursor-pointer border-green-600`;
      case 'occupied':
        return `${baseClasses} bg-red-500 text-white border-red-600 cursor-not-allowed`;
      case 'completed':
        return `${baseClasses} bg-gray-400 text-white border-gray-500 cursor-not-allowed`;
      case 'unavailable':
        return `${baseClasses} bg-purple-200 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 cursor-not-allowed`;
      default:
        return baseClasses;
    }
  };

  if (!doctorId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Seleccione un doctor para ver el calendario de disponibilidad</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Este doctor no tiene horarios asignados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 text-center">
          <h3 className="font-semibold text-lg">
            Semana del {format(currentWeekStart, 'dd/MM/yyyy', { locale: es })} al {format(weekEnd, 'dd/MM/yyyy', { locale: es })}
          </h3>
          <div className="flex items-center gap-2 justify-center mt-2">
            <Input
              type="date"
              value={jumpToDate}
              onChange={(e) => setJumpToDate(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-40"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleJumpToDate}
              disabled={!jumpToDate}
            >
              Ir
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-200 dark:bg-purple-900/30 rounded border border-purple-300"></div>
          <span>Fuera de horario</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded border border-gray-500"></div>
          <span>Atendido</span>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="border rounded-lg overflow-auto max-h-[500px]">
        <div className="min-w-[800px]">
          {/* Header de días */}
          <div className="grid grid-cols-8 gap-0 bg-muted/50 sticky top-0 z-10">
            <div className="p-2 font-semibold text-sm border-b border-r">Horario</div>
            {weekDays.map((day, idx) => (
              <div key={idx} className="p-2 text-center border-b border-r last:border-r-0">
                <div className="font-semibold text-sm">
                  {format(day, 'EEE', { locale: es }).toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(day, 'dd/MM/yyyy')}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de horarios */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-0">
              <div className="p-2 text-sm font-medium border-b border-r flex items-center">
                {time}
              </div>
              {weekDays.map((day, idx) => {
                const status = getSlotStatus(day, time);
                return (
                  <div
                    key={idx}
                    className="p-1 border-b border-r last:border-r-0"
                  >
                    <button
                      type="button"
                      className={`${getSlotClassName(day, time)} w-full flex items-center justify-center`}
                      onClick={() => handleSlotClick(day, time)}
                      disabled={status !== 'available'}
                      title={
                        status === 'occupied' ? 'Ocupado' :
                        status === 'completed' ? 'Cita completada' :
                        status === 'unavailable' ? 'Fuera de horario' :
                        'Disponible'
                      }
                    >
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="text-center text-sm text-muted-foreground">
          Seleccionado: {format(parseISO(selectedDate), "dd 'de' MMMM yyyy", { locale: es })} a las {selectedTime}
        </div>
      )}
    </div>
  );
}
