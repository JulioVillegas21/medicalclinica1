import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Activity, 
  Pill, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { parseLocalDate } from "@/lib/utils";

interface MedicalRecord {
  id: string;
  patientEmail: string;
  appointmentId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  notes: string;
}

interface Prescription {
  id: string;
  patientEmail: string;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  date: string;
}

interface LatestDiagnosis {
  id: string;
  diagnosis: string;
  notes: string;
  doctorName: string;
  date: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientDni: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: Date;
  confirmedBy?: string;
  cancelledBy?: string;
}

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  matricula: string;
  availableSlots: string[];
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

export function PatientQuickActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [historyOpen, setHistoryOpen] = useState(false);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [prescriptionsOpen, setPrescriptionsOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  
  // New appointment booking states
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const { data: medicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records/my-records"],
    enabled: historyOpen,
  });

  const { data: latestDiagnosis } = useQuery<LatestDiagnosis | null>({
    queryKey: ["/api/diagnoses/latest"],
    enabled: diagnosisOpen,
  });

  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/my-prescriptions"],
    enabled: prescriptionsOpen,
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/my-appointments"],
    enabled: appointmentsOpen,
  });

  const { data: allDoctors = [], isLoading: isDoctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
    enabled: bookAppointmentOpen,
  });

  const { data: officeAssignments = [], isLoading: isAssignmentsLoading } = useQuery<OfficeAssignment[]>({
    queryKey: ["/api/office-assignments"],
    enabled: bookAppointmentOpen,
  });

  // Get appointments for the selected doctor only (for availability checking)
  const { data: allAppointmentsForBooking = [], isLoading: isAppointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/doctor", selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return [];
      const response = await fetch(`/api/appointments/doctor/${selectedDoctorId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Error al obtener citas del doctor");
      }
      return response.json();
    },
    enabled: bookAppointmentOpen && !!selectedDoctorId,
  });

  // Get unique specialties
  const specialties = Array.from(
    new Set(allDoctors?.map(d => d.specialty) || [])
  ).sort();

  // Filter doctors based on selected specialty
  const filteredDoctors = selectedSpecialty
    ? allDoctors?.filter(d => d.specialty === selectedSpecialty) || []
    : allDoctors || [];

  const confirmMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al confirmar cita");
      }
      return response.json();
    },
    onSuccess: (appointment: any) => {
      toast({
        title: "✅ Cita confirmada",
        description: "Tu cita ha sido confirmada exitosamente",
      });
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      if (appointment?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", appointment.doctorId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/appointments/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cancellationReason: reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cancelar cita");
      }
      return await response.json();
    },
    onSuccess: (appointment: any) => {
      toast({
        title: "✅ Cita cancelada",
        description: "Tu cita ha sido cancelada exitosamente. El turno ahora está libre para otras personas.",
      });
      setSelectedAppointment(null);
      setCancelReason("");
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      if (appointment?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", appointment.doctorId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear la cita");
      }
      return response.json();
    },
    onSuccess: (appointment: any) => {
      toast({
        title: "✅ Cita agendada",
        description: "Tu cita se ha agendado exitosamente. Recibirás un email de confirmación.",
      });
      setBookAppointmentOpen(false);
      resetBookingForm();
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      if (appointment?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", appointment.doctorId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetBookingForm = () => {
    setSelectedSpecialty("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setReason("");
  };

  const handleSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para agendar una cita",
        variant: "destructive",
      });
      return;
    }

    const selectedDoctor = allDoctors?.find(d => d.id === selectedDoctorId);
    if (!selectedDoctor) {
      toast({
        title: "Error",
        description: "Por favor selecciona un doctor",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha y hora del calendario",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Por favor indica el motivo de la consulta",
        variant: "destructive",
      });
      return;
    }

    // Validate slot availability
    const [yearStr, monthStr, dayStr] = selectedDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const appointmentDate = new Date(year, month - 1, parseInt(dayStr, 10));
    const dayOfWeek = appointmentDate.getDay();

    const validAssignments = officeAssignments.filter(assignment =>
      assignment.doctorId === selectedDoctorId &&
      assignment.month === month &&
      assignment.year === year &&
      assignment.weekDays.includes(dayOfWeek)
    );

    if (validAssignments.length === 0) {
      toast({
        title: "Error",
        description: "El doctor no tiene asignación para la fecha seleccionada",
        variant: "destructive",
      });
      return;
    }

    const isValidTime = validAssignments.some(assignment => {
      const slots = generateTimeSlots(assignment.startTime, assignment.endTime);
      return slots.includes(selectedTime);
    });

    if (!isValidTime) {
      toast({
        title: "Error",
        description: "El horario seleccionado no está disponible para este doctor",
        variant: "destructive",
      });
      return;
    }

    // Check if slot is already occupied
    const existingAppointment = allAppointmentsForBooking?.find(
      apt => apt.doctorId === selectedDoctorId && 
             apt.date === selectedDate && 
             apt.time === selectedTime &&
             apt.status !== 'cancelada'
    );

    if (existingAppointment) {
      toast({
        title: "Error",
        description: "Este horario ya está ocupado por otra cita",
        variant: "destructive",
      });
      return;
    }

    const appointmentData = {
      patientName: `${user.firstName} ${user.lastName}`,
      patientDni: user.dni || "",
      patientEmail: user.email,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor.name,
      date: selectedDate,
      time: selectedTime,
      reason: reason,
      status: "pendiente",
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
      confirmada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
      completada: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      cancelada: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return styles[status as keyof typeof styles] || styles.pendiente;
  };

  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    return aptDate >= new Date();
  });

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-violet-500"
          onClick={() => setHistoryOpen(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-violet-600" />
              Historial Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Consulta tu historial completo de consultas médicas
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
          onClick={() => setDiagnosisOpen(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-purple-600" />
              Último Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ver diagnóstico de tu última consulta
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-pink-500"
          onClick={() => setPrescriptionsOpen(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-pink-600" />
              Recetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Revisa tus recetas médicas activas
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-rose-500"
          onClick={() => setAppointmentsOpen(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-rose-600" />
              Mis Turnos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confirma o cancela tus citas médicas
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => setBookAppointmentOpen(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-blue-600" />
              Agendar Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reserva una nueva cita médica
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Historial Médico
            </DialogTitle>
            <DialogDescription>
              Registro completo de tus consultas médicas
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {medicalRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes registros médicos aún</p>
            ) : (
              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{record.doctorName}</CardTitle>
                          <CardDescription>
                            {format(parseLocalDate(record.date), "PPP", { locale: es })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Diagnóstico:
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{record.diagnosis}</p>
                        </div>
                        {record.notes && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Notas:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={diagnosisOpen} onOpenChange={setDiagnosisOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Último Diagnóstico
            </DialogTitle>
          </DialogHeader>
          {!latestDiagnosis ? (
            <p className="text-center text-gray-500 py-8">No tienes diagnósticos registrados</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Fecha:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(parseLocalDate(latestDiagnosis.date), "PPP", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Médico:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{latestDiagnosis.doctorName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{latestDiagnosis.diagnosis}</p>
              </div>
              {latestDiagnosis.notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notas:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{latestDiagnosis.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={prescriptionsOpen} onOpenChange={setPrescriptionsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-pink-600" />
              Recetas Médicas
            </DialogTitle>
            <DialogDescription>
              Tus prescripciones médicas activas
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {prescriptions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes recetas registradas</p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{prescription.medication}</CardTitle>
                          <CardDescription>
                            Dr. {prescription.doctorName} - {format(parseLocalDate(prescription.date), "PPP", { locale: es })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Dosis:</p>
                          <p className="text-gray-600 dark:text-gray-400">{prescription.dosage}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Frecuencia:</p>
                          <p className="text-gray-600 dark:text-gray-400">{prescription.frequency}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Duración:</p>
                          <p className="text-gray-600 dark:text-gray-400">{prescription.duration}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Instrucciones:</p>
                          <p className="text-gray-600 dark:text-gray-400">{prescription.instructions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentsOpen} onOpenChange={setAppointmentsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-600" />
              Mis Turnos
            </DialogTitle>
            <DialogDescription>
              Gestiona tus citas médicas
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes turnos próximos</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <Card key={apt.id} className="relative border-2 hover:shadow-lg transition-all">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 font-bold">
                            <User className="h-5 w-5 text-blue-600" />
                            {apt.doctorName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2 text-base">
                            <Clock className="h-4 w-4 text-purple-600" />
                            {format(parseLocalDate(apt.date), "PPP", { locale: es })} a las {apt.time}
                          </CardDescription>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getStatusBadge(apt.status)}`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Motivo de la consulta:</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{apt.reason}</p>
                      </div>

                      {apt.status === 'pendiente' && (
                        <div className="space-y-2">
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-2">
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                              ⏰ Esta cita está pendiente de confirmación
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="lg"
                              onClick={() => confirmMutation.mutate(apt.id)}
                              disabled={confirmMutation.isPending}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              <CheckCircle2 className="h-5 w-5 mr-2" />
                              Confirmar Cita
                            </Button>
                            <Button
                              size="lg"
                              variant="destructive"
                              onClick={() => setSelectedAppointment(apt.id)}
                              disabled={cancelMutation.isPending}
                              className="flex-1 font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              <XCircle className="h-5 w-5 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {apt.status === 'confirmada' && (
                        <div className="space-y-2">
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2">
                            <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                              ✓ Esta cita está confirmada. No olvides asistir.
                            </p>
                          </div>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setSelectedAppointment(apt.id)}
                            disabled={cancelMutation.isPending}
                            className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold"
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            Cancelar esta Cita
                          </Button>
                        </div>
                      )}

                      {apt.status === 'cancelada' && (
                        <div className="space-y-2">
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-2">
                              ❌ Esta cita ha sido cancelada por la clínica
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-400">
                              Si deseas más información, por favor comunícate con nosotros o revisa el email que te enviamos con los detalles de la cancelación.
                            </p>
                          </div>
                        </div>
                      )}

                      {apt.status === 'completada' && (
                        <div className="space-y-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                              ✓ Esta cita ya ha sido completada
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    {selectedAppointment === apt.id && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-6 flex flex-col justify-center">
                        <h4 className="font-semibold mb-3">¿Por qué deseas cancelar esta cita?</h4>
                        <Textarea
                          placeholder="Razón de cancelación (opcional)"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="mb-3"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(null);
                              setCancelReason("");
                            }}
                            className="flex-1"
                          >
                            Volver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelMutation.mutate({ id: apt.id, reason: cancelReason })}
                            disabled={cancelMutation.isPending}
                            className="flex-1"
                          >
                            Confirmar Cancelación
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={bookAppointmentOpen} onOpenChange={(open) => {
        setBookAppointmentOpen(open);
        if (!open) resetBookingForm();
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Agendar Nueva Cita
            </DialogTitle>
            <DialogDescription>
              Selecciona un doctor y horario para tu próxima consulta
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBookAppointment} className="space-y-6">
            <div className="grid gap-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-sm">Información del Paciente</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nombre Completo</Label>
                  <Input
                    value={user ? `${user.firstName} ${user.lastName}` : ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label>DNI</Label>
                  <Input
                    value={user?.dni || ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Especialidad *</Label>
                  <Select
                    value={selectedSpecialty}
                    onValueChange={(value) => {
                      setSelectedSpecialty(value);
                      setSelectedDoctorId("");
                      setSelectedDate("");
                      setSelectedTime("");
                    }}
                  >
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="Selecciona una especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doctor">Doctor *</Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={(value) => {
                      setSelectedDoctorId(value);
                      setSelectedDate("");
                      setSelectedTime("");
                    }}
                    disabled={!selectedSpecialty}
                  >
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Selecciona un doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motivo de la Consulta *</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe brevemente el motivo de tu consulta"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-20"
                />
              </div>

              {selectedDoctorId && (
                <div className="space-y-2">
                  <Label>Selecciona Fecha y Hora *</Label>
                  {isAssignmentsLoading || isAppointmentsLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>Cargando horarios disponibles...</p>
                    </div>
                  ) : (
                    <WeeklyCalendar
                      doctorId={selectedDoctorId}
                      officeAssignments={officeAssignments || []}
                      appointments={allAppointmentsForBooking || []}
                      onSelectSlot={handleSlotSelect}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBookAppointmentOpen(false);
                  resetBookingForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!selectedDoctorId || !selectedDate || !selectedTime || !reason.trim() || createAppointmentMutation.isPending}
              >
                {createAppointmentMutation.isPending ? "Agendando..." : "Agendar Cita"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
