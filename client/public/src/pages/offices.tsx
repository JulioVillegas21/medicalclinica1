import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Briefcase, Plus, Trash2, Calendar, Clock, User, AlertCircle, Edit, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DoctorInfoPanel } from "@/components/DoctorInfoPanel";

interface Office {
  id: string;
  name: string;
  specialty: string;
  capacity: number;
  equipment: string[];
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

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear + 1];
};

const getAvailableMonths = (year: number) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (year === currentYear) {
    return MONTHS.map((name, index) => ({ value: index + 1, name }))
      .filter(month => month.value >= currentMonth);
  }
  
  return MONTHS.map((name, index) => ({ value: index + 1, name }));
};

export default function Offices() {
  const currentDate = new Date();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [assignmentToEdit, setAssignmentToEdit] = useState<OfficeAssignment | null>(null);
  const [assignmentToCertificate, setAssignmentToCertificate] = useState<OfficeAssignment | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("12:00");
  const { toast } = useToast();

  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths(selectedYear);

  const { data: offices } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: assignments, isLoading } = useQuery<OfficeAssignment[]>({
    queryKey: ["/api/office-assignments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/office-assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-assignments"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Asignación creada",
        description: "El consultorio se ha asignado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear la asignación. El consultorio puede estar ocupado en ese horario.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/office-assignments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-assignments"] });
      setEditOpen(false);
      setAssignmentToEdit(null);
      resetForm();
      toast({
        title: "Asignación actualizada",
        description: "La asignación se ha actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar la asignación.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/office-assignments/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-assignments"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Asignación eliminada",
        description: "La asignación se ha eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la asignación",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    const now = new Date();
    setSelectedOfficeId("");
    setSelectedDoctorId("");
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setSelectedDays([]);
    setStartTime("08:00");
    setEndTime("12:00");
  };

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    setSelectedYear(newYear);
    
    const months = getAvailableMonths(newYear);
    if (!months.find(m => m.value === selectedMonth)) {
      setSelectedMonth(months[0]?.value || 1);
    }
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un día de la semana",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Error",
        description: "La hora de inicio debe ser anterior a la hora de fin",
        variant: "destructive",
      });
      return;
    }

    const office = offices?.find(o => o.id === selectedOfficeId);
    const doctor = doctors?.find(d => d.id === selectedDoctorId);

    if (!office || !doctor) {
      toast({
        title: "Error",
        description: "Debe seleccionar un consultorio y un médico",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      officeId: selectedOfficeId,
      officeName: office.name,
      doctorId: selectedDoctorId,
      doctorName: doctor.name,
      month: selectedMonth,
      year: selectedYear,
      weekDays: selectedDays,
      startTime,
      endTime,
    });
  };

  const handleEdit = (assignment: OfficeAssignment) => {
    setAssignmentToEdit(assignment);
    setSelectedOfficeId(assignment.officeId);
    setSelectedDoctorId(assignment.doctorId);
    setSelectedMonth(assignment.month);
    setSelectedYear(assignment.year);
    setSelectedDays(assignment.weekDays);
    setStartTime(assignment.startTime);
    setEndTime(assignment.endTime);
    setEditOpen(true);
  };

  const handleCertificate = (assignment: OfficeAssignment) => {
    setAssignmentToCertificate(assignment);
    setCertificateOpen(true);
  };

  const handleDelete = (id: string) => {
    setAssignmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (assignmentToDelete) {
      deleteMutation.mutate(assignmentToDelete);
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un día de la semana",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Error",
        description: "La hora de inicio debe ser anterior a la hora de fin",
        variant: "destructive",
      });
      return;
    }

    const office = offices?.find(o => o.id === selectedOfficeId);
    const doctor = doctors?.find(d => d.id === selectedDoctorId);

    if (!office || !doctor || !assignmentToEdit) {
      toast({
        title: "Error",
        description: "Debe seleccionar un consultorio y un médico",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: assignmentToEdit.id,
      data: {
        officeId: selectedOfficeId,
        officeName: office.name,
        doctorId: selectedDoctorId,
        doctorName: doctor.name,
        month: selectedMonth,
        year: selectedYear,
        weekDays: selectedDays,
        startTime,
        endTime,
      },
    });
  };

  const getAssignmentsByOffice = () => {
    if (!assignments) return {};
    
    const grouped: Record<string, OfficeAssignment[]> = {};
    assignments.forEach(assignment => {
      if (!grouped[assignment.officeId]) {
        grouped[assignment.officeId] = [];
      }
      grouped[assignment.officeId].push(assignment);
    });
    return grouped;
  };

  const assignmentsByOffice = getAssignmentsByOffice();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Consultorios</h1>
          <p className="text-muted-foreground">
            Asigna médicos a consultorios y gestiona sus horarios
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Asignación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asignar Consultorio</DialogTitle>
              <DialogDescription>
                Asigna un consultorio a un médico con horarios específicos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-[1fr_350px]">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="office">Consultorio</Label>
                  <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar consultorio" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices?.map((office) => (
                        <SelectItem key={office.id} value={office.id}>
                          {office.name} - {office.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Médico</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Mes</Label>
                  <Select 
                    value={selectedMonth.toString()} 
                    onValueChange={(v) => setSelectedMonth(parseInt(v))} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={handleYearChange} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Días de la semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selectedDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? "Creando..." : "Crear Asignación"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
            
            {selectedDoctorId && doctors && assignments && (
              <DoctorInfoPanel
                doctor={doctors.find(d => d.id === selectedDoctorId)!}
                assignments={assignments}
              />
            )}
            
            {!selectedDoctorId && (
              <div className="hidden md:flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Seleccione un médico para ver su información
                </p>
              </div>
            )}
          </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando consultorios...</p>
          </div>
        ) : offices && offices.length > 0 ? (
          offices.map((office) => {
            const officeAssignments = assignmentsByOffice[office.id] || [];
            return (
              <Card key={office.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{office.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Especialidad: {office.specialty}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {officeAssignments.length} asignación{officeAssignments.length !== 1 ? 'es' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Equipamiento:</strong> {office.equipment.join(", ")}
                    </div>
                    
                    {officeAssignments.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Asignaciones actuales:</h4>
                        {officeAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{assignment.doctorName}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {MONTHS[assignment.month - 1]} {assignment.year}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{assignment.startTime} - {assignment.endTime}</span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Días: {assignment.weekDays
                                  .sort((a, b) => a - b)
                                  .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
                                  .join(", ")}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCertificate(assignment)}
                                title="Ver comprobante"
                              >
                                <FileText className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(assignment)}
                                disabled={updateMutation.isPending}
                                title="Editar asignación"
                              >
                                <Edit className="w-4 h-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(assignment.id)}
                                disabled={deleteMutation.isPending}
                                title="Eliminar asignación"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No hay asignaciones para este consultorio
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay consultorios disponibles</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Asignación</DialogTitle>
            <DialogDescription>
              Modifica la asignación del consultorio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-office">Consultorio</Label>
                <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar consultorio" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices?.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name} - {office.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Médico</Label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-month">Mes</Label>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(v) => setSelectedMonth(parseInt(v))} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-year">Año</Label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={handleYearChange} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Hora de inicio</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Hora de fin</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                {updateMutation.isPending ? "Actualizando..." : "Actualizar Asignación"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader data-print-hide>
            <DialogTitle>Comprobante de Asignación</DialogTitle>
            <DialogDescription>
              Detalles completos de la asignación del consultorio
            </DialogDescription>
          </DialogHeader>
          {assignmentToCertificate && (
            <>
              <div className="space-y-6" data-print-content>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold">Comprobante de Asignación de Consultorio</h1>
                  <p className="text-sm text-muted-foreground mt-2">Medical Clínica - Gestión Médica</p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Información de la Asignación</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Consultorio</p>
                      <p className="font-medium">{assignmentToCertificate.officeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Médico</p>
                      <p className="font-medium">{assignmentToCertificate.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Período</p>
                      <p className="font-medium">
                        {MONTHS[assignmentToCertificate.month - 1]} {assignmentToCertificate.year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Horario</p>
                      <p className="font-medium">
                        {assignmentToCertificate.startTime} - {assignmentToCertificate.endTime}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Días de atención</p>
                      <p className="font-medium">
                        {assignmentToCertificate.weekDays
                          .sort((a, b) => a - b)
                          .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Fecha de creación</p>
                      <p className="font-medium">
                        {new Date(assignmentToCertificate.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    Este comprobante certifica que el/la <strong>{assignmentToCertificate.doctorName}</strong> tiene asignado
                    el <strong>{assignmentToCertificate.officeName}</strong> durante el mes de <strong>{MONTHS[assignmentToCertificate.month - 1]} 
                    de {assignmentToCertificate.year}</strong>, en el horario de <strong>{assignmentToCertificate.startTime} a {assignmentToCertificate.endTime}</strong>.
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la asignación del consultorio. El médico ya no tendrá acceso a este consultorio en el horario seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
