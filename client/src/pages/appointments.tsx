import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, User, Phone, Stethoscope, FileText, Plus, Search, CreditCard, Edit, Trash2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Appointment, Doctor } from "@/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { parseLocalDate } from "@/lib/utils";

const statusConfig = {
  pendiente: { label: "Pendiente", variant: "secondary" as const },
  confirmada: { label: "Confirmada", variant: "default" as const },
  completada: { label: "Completada", variant: "outline" as const },
  cancelada: { label: "Cancelada", variant: "destructive" as const },
};

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

export default function Appointments() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToCertificate, setAppointmentToCertificate] = useState<Appointment | null>(null);
  const [appointmentToConfirm, setAppointmentToConfirm] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [editSpecialty, setEditSpecialty] = useState<string>("");
  const [editDoctorId, setEditDoctorId] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editAvailableSlots, setEditAvailableSlots] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<"dni" | "doctor">("dni");
  const [searchValue, setSearchValue] = useState<string>("");
  const [searched, setSearched] = useState<boolean>(false);
  const { toast} = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: allDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: officeAssignments } = useQuery<OfficeAssignment[]>({
    queryKey: ["/api/office-assignments"],
  });

  // Get unique specialties
  const specialties = Array.from(
    new Set(allDoctors?.map(d => d.specialty) || [])
  ).sort();

  // Filter doctors based on selected specialty
  const filteredDoctors = selectedSpecialty
    ? allDoctors?.filter(d => d.specialty === selectedSpecialty) || []
    : allDoctors || [];

  // Update edit available slots when edit doctor and date are selected
  useEffect(() => {
    if (!editDoctorId || !editDate || !officeAssignments) {
      setEditAvailableSlots([]);
      return;
    }

    const [yearStr, monthStr, dayStr] = editDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const appointmentDate = new Date(year, month - 1, parseInt(dayStr, 10));
    const dayOfWeek = appointmentDate.getDay();

    const validAssignments = officeAssignments.filter(assignment =>
      assignment.doctorId === editDoctorId &&
      assignment.month === month &&
      assignment.year === year &&
      assignment.weekDays.includes(dayOfWeek)
    );

    if (validAssignments.length === 0) {
      setEditAvailableSlots([]);
      return;
    }

    const allSlots: string[] = [];
    validAssignments.forEach(assignment => {
      const slots = generateTimeSlots(assignment.startTime, assignment.endTime);
      allSlots.push(...slots);
    });

    const uniqueSlots = Array.from(new Set(allSlots)).sort();
    setEditAvailableSlots(uniqueSlots);
  }, [editDoctorId, editDate, officeAssignments]);

  // Reset doctor selection when specialty changes
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
    // Only reset doctor if it doesn't match the new specialty
    if (selectedDoctorId && allDoctors) {
      const doctor = allDoctors.find(d => d.id === selectedDoctorId);
      if (doctor && doctor.specialty !== specialty) {
        setSelectedDoctorId("");
        setSelectedDate("");
        setSelectedTime("");
      }
    }
  };

  // Reset date/time when doctor changes
  useEffect(() => {
    setSelectedDate("");
    setSelectedTime("");
  }, [selectedDoctorId]);

  // Reset date/time when edit doctor changes
  useEffect(() => {
    setEditDate("");
    setEditTime("");
  }, [editDoctorId]);

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedSpecialty("");
      setSelectedDoctorId("");
      setSelectedDate("");
      setSelectedTime("");
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Invalidar todas las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/my-appointments"] });
      if (data?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", data.doctorId] });
      }
      handleOpenChange(false);
      toast({
        title: "Cita creada",
        description: "La cita se ha reservado exitosamente. El turno ahora está ocupado.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "No se pudo crear la cita";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status, cancellationReason });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/my-appointments"] });
      if (data?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", data.doctorId] });
      }
      toast({
        title: "Estado actualizado",
        description: "El estado de la cita se ha actualizado",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/my-appointments"] });
      if (data?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", data.doctorId] });
      }
      if (appointmentToEdit?.doctorId && data?.doctorId !== appointmentToEdit.doctorId) {
        // Si cambió de doctor, invalidar también el anterior
        queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", appointmentToEdit.doctorId] });
      }
      setEditOpen(false);
      setAppointmentToEdit(null);
      setEditSpecialty("");
      setEditDoctorId("");
      setEditDate("");
      setEditTime("");
      setEditAvailableSlots([]);
      toast({
        title: "Cita actualizada",
        description: "La cita se ha actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const selectedDoctor = allDoctors?.find(d => d.id === selectedDoctorId);
    if (!selectedDoctor) {
      toast({
        title: "Error",
        description: "Por favor seleccione un doctor",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Por favor seleccione una fecha y hora del calendario",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected slot is still valid for the current doctor
    if (!officeAssignments) {
      toast({
        title: "Error",
        description: "Cargando datos de disponibilidad, intente nuevamente",
        variant: "destructive",
      });
      return;
    }

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

    // Check if the slot is already occupied
    const existingAppointment = appointments?.find(
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
    
    const data = {
      patientName: formData.get("patientName") as string,
      patientDni: formData.get("patientDni") as string,
      patientEmail: formData.get("patientEmail") as string,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor.name,
      date: selectedDate,
      time: selectedTime,
      reason: formData.get("reason") as string,
      status: "pendiente",
    };
    createMutation.mutate(data);
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast({
        title: "Valor de búsqueda requerido",
        description: `Por favor ingrese un ${searchType === "dni" ? "DNI" : "nombre de doctor"} para buscar`,
        variant: "destructive",
      });
      return;
    }
    setSearched(true);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setSearched(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setEditDoctorId(appointment.doctorId);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
    setEditSpecialty(allDoctors?.find(d => d.id === appointment.doctorId)?.specialty || "");
    setEditOpen(true);
  };

  const handleEditSlotSelect = (date: string, time: string) => {
    setEditDate(date);
    setEditTime(time);
  };

  const handleEditOpenChange = (isOpen: boolean) => {
    setEditOpen(isOpen);
    if (!isOpen) {
      setAppointmentToEdit(null);
      setEditSpecialty("");
      setEditDoctorId("");
      setEditDate("");
      setEditTime("");
      setEditAvailableSlots([]);
    }
  };

  const handleCertificate = (appointment: Appointment) => {
    setAppointmentToCertificate(appointment);
    setCertificateOpen(true);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  const handleConfirmCancellation = () => {
    if (!appointmentToCancel) return;

    if (!cancellationReason.trim()) {
      toast({
        title: "Motivo requerido",
        description: "Por favor ingresa el motivo de la cancelación",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({ 
      id: appointmentToCancel.id, 
      status: "cancelada",
      cancellationReason: cancellationReason.trim()
    });
    setCancelDialogOpen(false);
    setAppointmentToCancel(null);
    setCancellationReason("");
  };

  const handleOpenConfirmDialog = (appointment: Appointment) => {
    setAppointmentToConfirm(appointment);
    setConfirmationCode("");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAppointment = () => {
    if (!appointmentToConfirm) return;

    const expectedCode = appointmentToConfirm.id.substring(0, 8).toUpperCase();
    const enteredCode = confirmationCode.trim().toUpperCase();

    if (enteredCode !== expectedCode) {
      toast({
        title: "Código Incorrecto",
        description: "El código de confirmación no coincide. Revisa el email que recibiste.",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({ id: appointmentToConfirm.id, status: "confirmada" });
    setConfirmDialogOpen(false);
    setAppointmentToConfirm(null);
    setConfirmationCode("");
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const selectedDoctor = allDoctors?.find(d => d.id === editDoctorId);
    if (!selectedDoctor || !appointmentToEdit) {
      toast({
        title: "Error",
        description: "Por favor seleccione un doctor",
        variant: "destructive",
      });
      return;
    }

    if (!editDate || !editTime) {
      toast({
        title: "Error",
        description: "Por favor seleccione una fecha y hora del calendario",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected slot is still valid for the current doctor
    if (!officeAssignments) {
      toast({
        title: "Error",
        description: "Cargando datos de disponibilidad, intente nuevamente",
        variant: "destructive",
      });
      return;
    }

    const [yearStr, monthStr, dayStr] = editDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const appointmentDate = new Date(year, month - 1, parseInt(dayStr, 10));
    const dayOfWeek = appointmentDate.getDay();

    const validAssignments = officeAssignments.filter(assignment =>
      assignment.doctorId === editDoctorId &&
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
      return slots.includes(editTime);
    });

    if (!isValidTime) {
      toast({
        title: "Error",
        description: "El horario seleccionado no está disponible para este doctor",
        variant: "destructive",
      });
      return;
    }

    // Check if the slot is already occupied (excluding the current appointment being edited)
    const existingAppointment = appointments?.find(
      apt => apt.id !== appointmentToEdit.id &&
             apt.doctorId === editDoctorId && 
             apt.date === editDate && 
             apt.time === editTime &&
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
    
    const data = {
      patientName: formData.get("patientName") as string,
      patientDni: formData.get("patientDni") as string,
      patientEmail: formData.get("patientEmail") as string,
      doctorId: editDoctorId,
      doctorName: selectedDoctor.name,
      date: editDate,
      time: editTime,
      reason: formData.get("reason") as string,
      status: appointmentToEdit.status,
    };
    
    updateMutation.mutate({ id: appointmentToEdit.id, data });
  };

  const handleEditSpecialtyChange = (specialty: string) => {
    setEditSpecialty(specialty);
    if (editDoctorId && allDoctors) {
      const doctor = allDoctors.find(d => d.id === editDoctorId);
      if (doctor && doctor.specialty !== specialty) {
        setEditDoctorId("");
        setEditDate("");
        setEditAvailableSlots([]);
      }
    }
  };

  const filteredEditDoctors = editSpecialty
    ? allDoctors?.filter(d => d.specialty === editSpecialty) || []
    : allDoctors || [];

  const sortedDoctors = allDoctors
    ? [...allDoctors].sort((a, b) => a.specialty.localeCompare(b.specialty))
    : [];

  const filteredAppointments = searched && appointments
    ? appointments.filter(appointment => {
        if (searchType === "dni") {
          return appointment.patientDni.toLowerCase().includes(searchValue.toLowerCase());
        } else {
          return appointment.doctorName === searchValue;
        }
      })
    : [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando citas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Citas</h1>
          <p className="text-sm text-muted-foreground">
            Programa y administra las citas médicas
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-appointment">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reservar Nueva Cita</DialogTitle>
              <DialogDescription>
                Complete los datos del paciente y la cita médica
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nombre del Paciente</Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    placeholder="Ej: María García"
                    required
                    data-testid="input-patient-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientDni">DNI</Label>
                  <Input
                    id="patientDni"
                    name="patientDni"
                    placeholder="Ej: 12345678"
                    required
                    data-testid="input-patient-dni"
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientEmail">Email del Paciente</Label>
                <Input
                  id="patientEmail"
                  name="patientEmail"
                  type="email"
                  placeholder="Ej: paciente@email.com"
                  required
                  data-testid="input-patient-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Select 
                  value={selectedSpecialty}
                  onValueChange={handleSpecialtyChange}
                >
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue placeholder="Seleccione una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map(specialty => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select 
                  value={selectedDoctorId}
                  onValueChange={setSelectedDoctorId}
                  required
                >
                  <SelectTrigger data-testid="select-doctor">
                    <SelectValue placeholder="Seleccione un doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Seleccione fecha y horario</Label>
                <WeeklyCalendar
                  doctorId={selectedDoctorId}
                  officeAssignments={officeAssignments || []}
                  appointments={appointments || []}
                  onSelectSlot={(date, time) => {
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo de la Consulta</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Describa el motivo de la consulta"
                  required
                  data-testid="textarea-reason"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || !officeAssignments || !appointments} 
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Guardando..." : "Reservar Cita"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Buscar Turnos por Paciente o Médico
            </CardTitle>
            {searched && filteredAppointments.length > 0 && (
              <Badge variant="default" className="text-base px-3 py-1">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'turno encontrado' : 'turnos encontrados'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="searchType" className="mb-2 block font-semibold">Buscar por</Label>
                <Select value={searchType} onValueChange={(value: "dni" | "doctor") => setSearchType(value)}>
                  <SelectTrigger id="searchType" data-testid="select-search-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dni">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        DNI del Paciente
                      </div>
                    </SelectItem>
                    <SelectItem value="doctor">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Nombre del Doctor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="searchValue" className="mb-2 block font-semibold">
                  {searchType === "dni" ? "DNI del Paciente" : "Nombre del Médico"}
                </Label>
                {searchType === "dni" ? (
                  <Input
                    id="searchValue"
                    placeholder="Ej: 12345678"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    data-testid="input-search-value"
                    className="h-11 text-base"
                  />
                ) : (
                  <Select value={searchValue} onValueChange={setSearchValue}>
                    <SelectTrigger id="searchValue" data-testid="select-search-value" className="h-11">
                      <SelectValue placeholder="Seleccione un médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedDoctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.name}>
                          {doctor.name} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSearch} data-testid="button-search" size="lg" className="flex-1 sm:flex-none">
                <Search className="w-4 h-4 mr-2" />
                Buscar Turnos
              </Button>
              {searched && (
                <Button variant="outline" onClick={handleClearSearch} data-testid="button-clear-search" size="lg">
                  Limpiar Búsqueda
                </Button>
              )}
            </div>
            
            {searched && filteredAppointments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredAppointments.filter(a => a.status === 'pendiente').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {filteredAppointments.filter(a => a.status === 'confirmada').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredAppointments.filter(a => a.status === 'completada').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {filteredAppointments.filter(a => a.status === 'cancelada').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Canceladas</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {!searched ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Realice una búsqueda para ver los turnos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seleccione un método de búsqueda e ingrese los datos
              </p>
            </CardContent>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay citas programadas</p>
              <p className="text-sm text-muted-foreground mt-1">
                No se encontraron turnos con los criterios de búsqueda
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} data-testid={`appointment-card-${appointment.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        DNI: {appointment.patientDni}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {appointment.patientEmail}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {parseLocalDate(appointment.date).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Stethoscope className="w-4 h-4" />
                        {appointment.doctorName}
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusConfig[appointment.status as keyof typeof statusConfig].variant}>
                    {statusConfig[appointment.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Motivo de consulta:</p>
                    <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCertificate(appointment)}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Comprobante
                  </Button>
                  {appointment.status !== "cancelada" && appointment.status !== "completada" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancelAppointment(appointment)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                  {appointment.status === "pendiente" && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfirmDialog(appointment)}
                      data-testid={`button-confirm-${appointment.id}`}
                    >
                      Confirmar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica los datos de la cita médica
            </DialogDescription>
          </DialogHeader>
          {appointmentToEdit && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-patientName">Nombre del Paciente</Label>
                  <Input
                    id="edit-patientName"
                    name="patientName"
                    defaultValue={appointmentToEdit.patientName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-patientDni">DNI</Label>
                  <Input
                    id="edit-patientDni"
                    name="patientDni"
                    defaultValue={appointmentToEdit.patientDni}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-patientEmail">Email del Paciente</Label>
                <Input
                  id="edit-patientEmail"
                  name="patientEmail"
                  type="email"
                  defaultValue={appointmentToEdit.patientEmail}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-specialty">Especialidad</Label>
                <Select 
                  value={editSpecialty}
                  onValueChange={handleEditSpecialtyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map(specialty => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Doctor</Label>
                <Select 
                  value={editDoctorId}
                  onValueChange={setEditDoctorId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEditDoctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editDoctorId && officeAssignments && appointments && (
                <div className="space-y-2">
                  <Label>Seleccione Fecha y Hora</Label>
                  <WeeklyCalendar
                    doctorId={editDoctorId}
                    officeAssignments={officeAssignments}
                    appointments={appointments.filter(apt => apt.id !== appointmentToEdit.id)}
                    onSelectSlot={handleEditSlotSelect}
                    selectedDate={editDate}
                    selectedTime={editTime}
                  />
                </div>
              )}

              {!editDoctorId && (
                <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                  Seleccione un doctor para ver los turnos disponibles
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-reason">Motivo de la Consulta</Label>
                <Textarea
                  id="edit-reason"
                  name="reason"
                  defaultValue={appointmentToEdit.reason}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEditOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || !editDate || !editTime}>
                  {updateMutation.isPending ? "Guardando..." : "Actualizar Cita"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader data-print-hide>
            <DialogTitle>Comprobante de Cita Médica</DialogTitle>
            <DialogDescription>
              Detalles completos de la cita
            </DialogDescription>
          </DialogHeader>
          {appointmentToCertificate && (
            <>
              <div className="space-y-6" data-print-content>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold">Comprobante de Cita Médica</h1>
                  <p className="text-sm text-muted-foreground mt-2">Medical Clínica - Gestión Médica</p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Información del Paciente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Paciente</p>
                      <p className="font-medium">{appointmentToCertificate.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">DNI</p>
                      <p className="font-medium">{appointmentToCertificate.patientDni}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{appointmentToCertificate.patientEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Información de la Cita</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Médico</p>
                      <p className="font-medium">{appointmentToCertificate.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-medium">
                        {statusConfig[appointmentToCertificate.status as keyof typeof statusConfig].label}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium">
                        {parseLocalDate(appointmentToCertificate.date).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Horario</p>
                      <p className="font-medium">{appointmentToCertificate.time}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Motivo de consulta</p>
                      <p className="font-medium">{appointmentToCertificate.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    Este comprobante certifica que <strong>{appointmentToCertificate.patientName}</strong> (DNI: <strong>{appointmentToCertificate.patientDni}</strong>) 
                    tiene una cita médica con <strong>{appointmentToCertificate.doctorName}</strong> el día{" "}
                    <strong>{parseLocalDate(appointmentToCertificate.date).toLocaleDateString('es-ES')}</strong> a las{" "}
                    <strong>{appointmentToCertificate.time}</strong>.
                  </p>
                </div>

                <div className="mt-12 pt-6 border-t text-center">
                  <p className="text-xs text-muted-foreground">
                    Documento generado el {new Date().toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2" data-print-hide>
                <Button 
                  onClick={() => window.print()} 
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Comprobante
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCertificateOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cita</DialogTitle>
            <DialogDescription>
              Ingresa el código de confirmación de 8 caracteres que recibiste por email
            </DialogDescription>
          </DialogHeader>
          {appointmentToConfirm && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">
                  Paciente: {appointmentToConfirm.patientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Doctor: {appointmentToConfirm.doctorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Fecha: {parseLocalDate(appointmentToConfirm.date).toLocaleDateString('es-ES')} - {appointmentToConfirm.time}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation-code">Código de Confirmación</Label>
                <Input
                  id="confirmation-code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                  placeholder="Ej: AB12CD34"
                  maxLength={8}
                  className="text-center text-lg tracking-widest font-mono uppercase"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Revisa el email enviado a: {appointmentToConfirm.patientEmail}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    setAppointmentToConfirm(null);
                    setConfirmationCode("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmAppointment}
                  disabled={confirmationCode.length !== 8}
                  className="flex-1"
                >
                  Confirmar Cita
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Cita</DialogTitle>
            <DialogDescription>
              Por favor ingresa el motivo de la cancelación. Este motivo será enviado al paciente por email.
            </DialogDescription>
          </DialogHeader>
          {appointmentToCancel && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Paciente: {appointmentToCancel.patientName}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Doctor: {appointmentToCancel.doctorName}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Fecha: {parseLocalDate(appointmentToCancel.date).toLocaleDateString('es-ES')} - {appointmentToCancel.time}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">Motivo de Cancelación *</Label>
                <Textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ej: El doctor tuvo una emergencia médica..."
                  rows={4}
                  className="resize-none"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Este motivo será enviado a: {appointmentToCancel.patientEmail}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelDialogOpen(false);
                    setAppointmentToCancel(null);
                    setCancellationReason("");
                  }}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmCancellation}
                  disabled={!cancellationReason.trim()}
                  className="flex-1"
                >
                  Cancelar Cita
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
