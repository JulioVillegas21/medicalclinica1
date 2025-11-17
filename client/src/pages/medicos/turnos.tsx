import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  PlayCircle, 
  SkipForward, 
  UserX, 
  RotateCcw, 
  ClipboardList, 
  Stethoscope,
  Pill,
  Plus,
  Save,
  Edit,
  Check
} from "lucide-react";
import type { Appointment } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PatientInQueue {
  appointment: Appointment;
  isEnabled: boolean;
}

interface ConsultationData {
  diagnosis: string;
  medicalHistory: string;
  needsMedication: boolean;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function MedicosTurnos() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);
  const [absentPatients, setAbsentPatients] = useState<Appointment[]>([]);
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false);
  const [consultationDataMap, setConsultationDataMap] = useState<Map<string, ConsultationData>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisEditing, setDiagnosisEditing] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [medicalHistoryEditing, setMedicalHistoryEditing] = useState(true);
  
  const [needsMedication, setNeedsMedication] = useState(false);
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medicationEditing, setMedicationEditing] = useState(true);
  
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/doctors/my-appointments"],
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;
  
  const todayAppointments = appointments.filter(apt => apt.date === todayString);
  
  const confirmedCount = todayAppointments.filter(apt => apt.status === "confirmada").length;
  const cancelledCount = todayAppointments.filter(apt => apt.status === "cancelada").length;
  
  const activeAppointments = todayAppointments.filter(apt => 
    (apt.status === "confirmada" || apt.status === "pendiente") &&
    !absentPatients.find(absent => absent.id === apt.id)
  ).sort((a, b) => a.time.localeCompare(b.time));

  const patientsQueue: PatientInQueue[] = activeAppointments.map((apt, index) => ({
    appointment: apt,
    isEnabled: index === 0
  }));

  const currentAppointment = activeAppointments.find(apt => apt.id === currentAppointmentId);

  const saveConsultationMutation = useMutation({
    mutationFn: async (data: { 
      appointmentId: string; 
      diagnosis: string; 
      medicalHistory: string;
    }) => {
      const res = await fetch('/api/doctors/save-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors/my-appointments"] });
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: {
      appointmentId: string;
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }) => {
      const res = await fetch('/api/doctors/create-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear receta');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors/my-appointments"] });
    },
  });

  const handleStartSession = () => {
    setSessionStarted(true);
  };

  const saveCurrentConsultationData = () => {
    if (!currentAppointmentId) return consultationDataMap;
    
    const newMap = new Map(consultationDataMap);
    newMap.set(currentAppointmentId, {
      diagnosis,
      medicalHistory,
      needsMedication,
      medication,
      dosage,
      frequency,
      duration,
      instructions,
    });
    setConsultationDataMap(newMap);
    return newMap;
  };

  const loadConsultationData = (appointmentId: string, dataMap: Map<string, ConsultationData>) => {
    const saved = dataMap.get(appointmentId);
    if (saved) {
      setDiagnosis(saved.diagnosis);
      setMedicalHistory(saved.medicalHistory);
      setNeedsMedication(saved.needsMedication);
      setMedication(saved.medication);
      setDosage(saved.dosage);
      setFrequency(saved.frequency);
      setDuration(saved.duration);
      setInstructions(saved.instructions);
    } else {
      resetFormFields();
    }
  };

  const handlePatientClick = (appointment: Appointment, isEnabled: boolean) => {
    if (!isEnabled) return;
    
    const updatedMap = saveCurrentConsultationData();
    
    setCurrentAppointmentId(appointment.id);
    loadConsultationData(appointment.id, updatedMap || consultationDataMap);
    setConsultationDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      saveCurrentConsultationData();
    }
    setConsultationDialogOpen(open);
  };

  const handleMarkAbsent = () => {
    if (!currentAppointment) return;
    setAbsentPatients([...absentPatients, currentAppointment]);
    
    const newMap = new Map(consultationDataMap);
    newMap.delete(currentAppointment.id);
    setConsultationDataMap(newMap);
    
    setConsultationDialogOpen(false);
    setCurrentAppointmentId(null);
    resetFormFields();
  };

  const handleResumeAbsent = (patient: Appointment) => {
    setAbsentPatients(absentPatients.filter(p => p.id !== patient.id));
  };

  const resetFormFields = () => {
    setDiagnosis("");
    setDiagnosisEditing(true);
    setMedicalHistory("");
    setMedicalHistoryEditing(true);
    setNeedsMedication(false);
    setMedication("");
    setDosage("");
    setFrequency("");
    setDuration("");
    setInstructions("");
    setMedicationEditing(true);
  };

  const handleFinishConsultation = async () => {
    if (!currentAppointment) return;
    if (isSaving) return;

    if (needsMedication && (!medication || !dosage || !frequency || !duration)) {
      alert('Por favor completa todos los campos de la receta médica antes de finalizar.');
      return;
    }

    setIsSaving(true);
    try {
      await saveConsultationMutation.mutateAsync({
        appointmentId: currentAppointment.id,
        diagnosis: diagnosis || '',
        medicalHistory: medicalHistory || '',
      });

      if (needsMedication && medication && dosage && frequency && duration) {
        try {
          await createPrescriptionMutation.mutateAsync({
            appointmentId: currentAppointment.id,
            medication,
            dosage,
            frequency,
            duration,
            instructions,
          });
        } catch (prescriptionError) {
          console.error("Error al crear receta médica:", prescriptionError);
          alert('La consulta se guardó correctamente, pero hubo un error al crear la receta. Por favor créala manualmente desde el historial del paciente.');
        }
      }

      const newMap = new Map(consultationDataMap);
      newMap.delete(currentAppointment.id);
      setConsultationDataMap(newMap);

      setConsultationDialogOpen(false);
      setCurrentAppointmentId(null);
      resetFormFields();
    } catch (error) {
      console.error("Error al finalizar consulta:", error);
      alert('Error al finalizar la consulta. Por favor intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (activeAppointments.length === 0 && sessionStarted) {
      setSessionStarted(false);
      setCurrentAppointmentId(null);
      setConsultationDialogOpen(false);
    }
  }, [activeAppointments.length, sessionStarted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Atención de Pacientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pacientes Confirmados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pacientes Cancelados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  Lista de Pacientes del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    Cargando turnos...
                  </div>
                ) : patientsQueue.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No hay pacientes en la cola</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!sessionStarted && (
                      <div className="mb-6 p-6 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border-2 border-emerald-300">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                          {patientsQueue.length} paciente{patientsQueue.length !== 1 ? 's' : ''} en espera
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Haz clic en "Comenzar Turnos" para iniciar la atención
                        </p>
                        <Button
                          onClick={handleStartSession}
                          className="bg-emerald-600 hover:bg-emerald-700"
                          size="lg"
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Comenzar Turnos
                        </Button>
                      </div>
                    )}
                    {patientsQueue.map((item, index) => (
                      <div
                        key={item.appointment.id}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          item.isEnabled && sessionStarted
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer'
                            : 'border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => sessionStarted && handlePatientClick(item.appointment, item.isEnabled)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              item.isEnabled && sessionStarted
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                : 'bg-gray-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{item.appointment.patientName}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {item.appointment.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  DNI: {item.appointment.patientDni}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {item.appointment.reason}
                              </p>
                            </div>
                          </div>
                          {!item.isEnabled && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              En espera
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <UserX className="h-4 w-4 text-yellow-600" />
                  Pacientes Ausentes ({absentPatients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {absentPatients.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay pacientes marcados como ausentes
                  </p>
                ) : (
                  <div className="space-y-3">
                    {absentPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {patient.patientName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {patient.time} - DNI: {patient.patientDni}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleResumeAbsent(patient)}
                            size="sm"
                            variant="ghost"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                            title="Revertir ausencia"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={consultationDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-emerald-600">Consulta Médica</DialogTitle>
          </DialogHeader>
          {currentAppointment && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border-2 border-emerald-200">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                      {currentAppointment.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {currentAppointment.patientName}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <User className="w-4 h-4" />
                          <span>DNI: {currentAppointment.patientDni}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{currentAppointment.patientEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{currentAppointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Motivo de consulta: </span>
                        <span className="text-gray-600 dark:text-gray-400">{currentAppointment.reason}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="diagnosis" className="text-base font-semibold flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                        Diagnóstico
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDiagnosisEditing(!diagnosisEditing)}
                        className="h-8"
                      >
                        {diagnosisEditing ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="diagnosis"
                      placeholder="Escribe el diagnóstico del paciente..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      disabled={!diagnosisEditing}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="medicalHistory" className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Agregar información de historial médico
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMedicalHistoryEditing(!medicalHistoryEditing)}
                        className="h-8"
                      >
                        {medicalHistoryEditing ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="medicalHistory"
                      placeholder="Agrega notas al historial médico del paciente..."
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      disabled={!medicalHistoryEditing}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Historial Médico Completo del Paciente
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Aquí se mostrará el historial médico completo del paciente (en desarrollo)
                  </p>
                </div>

                <div className="space-y-4 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Pill className="w-5 h-5 text-emerald-600" />
                      Medicamentos Recetados
                    </Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="needsMedication"
                        checked={needsMedication}
                        onCheckedChange={(checked) => setNeedsMedication(checked === true)}
                      />
                      <Label htmlFor="needsMedication" className="text-sm cursor-pointer">
                        ¿Necesita medicamento?
                      </Label>
                    </div>
                  </div>

                  {needsMedication && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMedicationEditing(!medicationEditing)}
                          className="h-8"
                        >
                          {medicationEditing ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor="medication" className="text-sm">Medicamento</Label>
                        <Input
                          id="medication"
                          placeholder="Nombre del medicamento"
                          value={medication}
                          onChange={(e) => setMedication(e.target.value)}
                          disabled={!medicationEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dosage" className="text-sm">Dosis</Label>
                        <Input
                          id="dosage"
                          placeholder="Ej: 500mg"
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                          disabled={!medicationEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency" className="text-sm">Frecuencia</Label>
                        <Input
                          id="frequency"
                          placeholder="Ej: Cada 8 horas"
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          disabled={!medicationEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration" className="text-sm">Duración</Label>
                        <Input
                          id="duration"
                          placeholder="Ej: 7 días"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          disabled={!medicationEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="instructions" className="text-sm">Instrucciones (opcional)</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Instrucciones adicionales..."
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          disabled={!medicationEditing}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t-2">
                  <Button
                    onClick={handleFinishConsultation}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                    disabled={isSaving || (!diagnosis && !medicalHistory)}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Turno Terminado
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleMarkAbsent}
                    variant="outline"
                    className="flex-1 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                    size="lg"
                    disabled={isSaving}
                  >
                    <UserX className="w-5 h-5 mr-2" />
                    Marcar Ausencia
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
