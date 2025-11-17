import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  FileText,
  Pill,
  Activity,
  Save,
  ArrowLeft,
  CheckCircle,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Clipboard,
  Send
} from "lucide-react";

interface PatientInfo {
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
    phone: string;
    dateOfBirth?: string;
    direccion?: string;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: string[];
    healthInsurance?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  } | null;
  appointment: any;
  medicalRecords: any[];
  prescriptions: any[];
  diagnoses: any[];
  studies: any[];
  preConsultForm: any | null;
}

export default function MedicosConsulta() {
  const [, params] = useRoute("/medicos/consulta/:appointmentId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const appointmentId = params?.appointmentId || "";

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });

  const [diagnosisForm, setDiagnosisForm] = useState({
    condition: "",
    description: "",
    severity: "moderado" as "leve" | "moderado" | "grave"
  });

  const [studyForm, setStudyForm] = useState({
    studyType: "",
    studyName: "",
    result: "",
    observations: ""
  });

  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: "",
    notes: ""
  });

  const { data: patientInfo, isLoading } = useQuery<PatientInfo>({
    queryKey: [`/api/doctors/patient-info/${appointmentId}`],
    enabled: !!appointmentId,
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: typeof prescriptionForm) => {
      const res = await fetch('/api/doctors/create-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear receta');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/doctors/patient-info/${appointmentId}`] });
      setPrescriptionForm({
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      });
      toast({
        title: "✅ Receta creada",
        description: "La receta se ha emitido correctamente y el paciente recibirá una notificación por email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createDiagnosisMutation = useMutation({
    mutationFn: async (data: typeof diagnosisForm) => {
      const res = await fetch('/api/doctors/create-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear diagnóstico');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/doctors/patient-info/${appointmentId}`] });
      setDiagnosisForm({
        condition: "",
        description: "",
        severity: "moderado"
      });
      toast({
        title: "✅ Diagnóstico guardado",
        description: "El diagnóstico se ha registrado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createStudyMutation = useMutation({
    mutationFn: async (data: typeof studyForm) => {
      const res = await fetch('/api/doctors/create-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear estudio');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/doctors/patient-info/${appointmentId}`] });
      setStudyForm({
        studyType: "",
        studyName: "",
        result: "",
        observations: ""
      });
      toast({
        title: "✅ Estudio registrado",
        description: "El estudio médico se ha guardado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createMedicalRecordMutation = useMutation({
    mutationFn: async (data: typeof medicalRecordForm) => {
      const res = await fetch('/api/doctors/create-medical-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear registro médico');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/doctors/patient-info/${appointmentId}`] });
      setMedicalRecordForm({
        diagnosis: "",
        notes: ""
      });
      toast({
        title: "✅ Historial actualizado",
        description: "El historial médico se ha actualizado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const completeConsultationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/doctors/complete-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al completar consulta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Consulta completada",
        description: "La consulta se ha finalizado exitosamente.",
      });
      setLocation("/medicos/turnos");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  if (!patientInfo || !patientInfo.patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">No se pudo cargar la información del paciente.</p>
            <Button onClick={() => setLocation("/medicos/turnos")} className="w-full mt-4">
              Volver a Turnos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { patient, appointment, medicalRecords, prescriptions, diagnoses, studies, preConsultForm } = patientInfo;

  // Provide safe fallbacks for patient data
  const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : appointment.patientName || 'Paciente';
  const patientInitials = patient 
    ? `${patient.firstName?.charAt(0) || ''}${patient.lastName?.charAt(0) || ''}` 
    : (appointment.patientName?.split(' ').map((n: string) => n.charAt(0)).join('') || 'P');
  const patientDni = patient?.dni || appointment.patientDni || 'N/A';
  const patientEmail = patient?.email || appointment.patientEmail || 'N/A';
  const patientPhone = patient?.phone || 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/medicos/turnos")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Consulta Médica
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {patientName}
              </p>
            </div>
          </div>
          <Button
            onClick={() => completeConsultationMutation.mutate()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalizar Consulta
          </Button>
        </div>

        {/* Patient Header Card */}
        <Card className="border-2 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                {patientInitials}
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Paciente</p>
                  <p className="font-semibold">{patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="font-semibold">{patientDni}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-sm">{patientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-semibold">{patientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Cita</p>
                  <p className="font-semibold">{appointment.date} - {appointment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Motivo</p>
                  <p className="font-semibold text-sm">{appointment.reason}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="patient-info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="patient-info">
              <User className="w-4 h-4 mr-2" />
              Paciente
            </TabsTrigger>
            <TabsTrigger value="prescription">
              <Pill className="w-4 h-4 mr-2" />
              Recetas
            </TabsTrigger>
            <TabsTrigger value="diagnosis">
              <Clipboard className="w-4 h-4 mr-2" />
              Diagnósticos
            </TabsTrigger>
            <TabsTrigger value="studies">
              <Activity className="w-4 h-4 mr-2" />
              Estudios
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Patient Info Tab */}
          <TabsContent value="patient-info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <span className="font-semibold">{patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Fecha de Nacimiento:</span>
                    <span className="font-semibold">{patient?.dateOfBirth || "No especificada"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Teléfono:</span>
                    <span className="font-semibold">{patientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-semibold text-sm">{patientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Dirección:</span>
                    <span className="font-semibold text-sm">{patient?.direccion || "No especificada"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Médica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600">Grupo Sanguíneo:</span>
                    <span className="font-semibold">{patient?.bloodType || "No especificado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Obra Social:</span>
                    <span className="font-semibold">{patient?.healthInsurance || "No especificada"}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 font-semibold">Alergias:</span>
                    </div>
                    {patient?.allergies && patient.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {patient.allergies.map((allergy, idx) => (
                          <Badge key={idx} variant="outline" className="bg-yellow-50">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 pl-6">Sin alergias registradas</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600 font-semibold">Condiciones Crónicas:</span>
                    </div>
                    {patient?.chronicConditions && patient.chronicConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {patient.chronicConditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="bg-orange-50">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 pl-6">Sin condiciones crónicas</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600 font-semibold">Medicación Actual:</span>
                    </div>
                    {patient?.currentMedications && patient.currentMedications.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {patient.currentMedications.map((med, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50">
                            {med}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 pl-6">Sin medicación actual</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <span className="font-semibold">{patient?.emergencyContactName || "No especificado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Teléfono:</span>
                    <span className="font-semibold">{patient?.emergencyContactPhone || "No especificado"}</span>
                  </div>
                </CardContent>
              </Card>

              {preConsultForm && (
                <Card className="md:col-span-2 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Formulario Pre-Consulta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 font-semibold">Síntomas Actuales:</span>
                      <p className="mt-1">{preConsultForm.currentSymptoms}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 font-semibold">Duración:</span>
                        <p className="mt-1">{preConsultForm.symptomDuration}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-semibold">Intensidad:</span>
                        <p className="mt-1">{preConsultForm.symptomIntensity}/10</p>
                      </div>
                    </div>
                    {preConsultForm.medicationTaken && (
                      <div>
                        <span className="text-sm text-gray-600 font-semibold">Medicación Tomada:</span>
                        <p className="mt-1">{preConsultForm.medicationTaken}</p>
                      </div>
                    )}
                    {preConsultForm.currentAllergies && (
                      <div>
                        <span className="text-sm text-gray-600 font-semibold">Alergias:</span>
                        <p className="mt-1">{preConsultForm.currentAllergies}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-600" />
                    Nueva Receta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medication">Medicamento *</Label>
                    <Input
                      id="medication"
                      value={prescriptionForm.medication}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                      placeholder="Nombre del medicamento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosis *</Label>
                    <Input
                      id="dosage"
                      value={prescriptionForm.dosage}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                      placeholder="Ej: 500mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frecuencia *</Label>
                    <Input
                      id="frequency"
                      value={prescriptionForm.frequency}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                      placeholder="Ej: Cada 8 horas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración *</Label>
                    <Input
                      id="duration"
                      value={prescriptionForm.duration}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                      placeholder="Ej: 7 días"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Indicaciones</Label>
                    <Textarea
                      id="instructions"
                      value={prescriptionForm.instructions}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                      placeholder="Indicaciones adicionales..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => createPrescriptionMutation.mutate(prescriptionForm)}
                    disabled={!prescriptionForm.medication || !prescriptionForm.dosage || !prescriptionForm.frequency || !prescriptionForm.duration}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Emitir Receta y Notificar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recetas del Paciente ({prescriptions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {prescriptions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No hay recetas registradas
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {prescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-lg text-emerald-700 dark:text-emerald-400">
                              {prescription.medication}
                            </h4>
                            <span className="text-xs text-gray-500">{prescription.date}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-semibold">Dosis:</span> {prescription.dosage}</p>
                            <p><span className="font-semibold">Frecuencia:</span> {prescription.frequency}</p>
                            <p><span className="font-semibold">Duración:</span> {prescription.duration}</p>
                            {prescription.instructions && (
                              <p><span className="font-semibold">Indicaciones:</span> {prescription.instructions}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-2">
                              Prescrito por: {prescription.doctorName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-emerald-600" />
                    Nuevo Diagnóstico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condición *</Label>
                    <Input
                      id="condition"
                      value={diagnosisForm.condition}
                      onChange={(e) => setDiagnosisForm({ ...diagnosisForm, condition: e.target.value })}
                      placeholder="Diagnóstico principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={diagnosisForm.description}
                      onChange={(e) => setDiagnosisForm({ ...diagnosisForm, description: e.target.value })}
                      placeholder="Descripción detallada del diagnóstico..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severidad</Label>
                    <Select
                      value={diagnosisForm.severity}
                      onValueChange={(value: "leve" | "moderado" | "grave") =>
                        setDiagnosisForm({ ...diagnosisForm, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="grave">Grave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => createDiagnosisMutation.mutate(diagnosisForm)}
                    disabled={!diagnosisForm.condition}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Diagnóstico
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Diagnósticos del Paciente ({diagnoses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnoses.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No hay diagnósticos registrados
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {diagnoses.map((diagnosis) => (
                        <div
                          key={diagnosis.id}
                          className="p-4 border rounded-lg border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-lg">{diagnosis.condition}</h4>
                            <Badge variant={
                              diagnosis.severity === 'grave' ? 'destructive' :
                              diagnosis.severity === 'moderado' ? 'default' : 'outline'
                            }>
                              {diagnosis.severity}
                            </Badge>
                          </div>
                          {diagnosis.description && (
                            <p className="text-sm text-gray-600 mb-2">{diagnosis.description}</p>
                          )}
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Fecha: {diagnosis.date}</p>
                            <p>Médico: {diagnosis.doctorName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Studies Tab */}
          <TabsContent value="studies" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Nuevo Estudio Médico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studyType">Tipo de Estudio *</Label>
                    <Select
                      value={studyForm.studyType}
                      onValueChange={(value) => setStudyForm({ ...studyForm, studyType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Análisis de Sangre">Análisis de Sangre</SelectItem>
                        <SelectItem value="Radiografía">Radiografía</SelectItem>
                        <SelectItem value="Tomografía">Tomografía</SelectItem>
                        <SelectItem value="Resonancia Magnética">Resonancia Magnética</SelectItem>
                        <SelectItem value="Ecografía">Ecografía</SelectItem>
                        <SelectItem value="Electrocardiograma">Electrocardiograma</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studyName">Nombre del Estudio *</Label>
                    <Input
                      id="studyName"
                      value={studyForm.studyName}
                      onChange={(e) => setStudyForm({ ...studyForm, studyName: e.target.value })}
                      placeholder="Especificar estudio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="result">Resultado</Label>
                    <Textarea
                      id="result"
                      value={studyForm.result}
                      onChange={(e) => setStudyForm({ ...studyForm, result: e.target.value })}
                      placeholder="Resultado del estudio..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observaciones</Label>
                    <Textarea
                      id="observations"
                      value={studyForm.observations}
                      onChange={(e) => setStudyForm({ ...studyForm, observations: e.target.value })}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => createStudyMutation.mutate(studyForm)}
                    disabled={!studyForm.studyType || !studyForm.studyName}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Registrar Estudio
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estudios del Paciente ({studies.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {studies.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No hay estudios registrados
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {studies.map((study) => (
                        <div
                          key={study.id}
                          className="p-4 border rounded-lg border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">{study.studyName}</h4>
                              <Badge variant="outline" className="mt-1">{study.studyType}</Badge>
                            </div>
                            <span className="text-xs text-gray-500">{study.date}</span>
                          </div>
                          {study.result && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700">Resultado:</p>
                              <p className="text-sm text-gray-600">{study.result}</p>
                            </div>
                          )}
                          {study.observations && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700">Observaciones:</p>
                              <p className="text-sm text-gray-600">{study.observations}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Agregar Entrada al Historial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="historyDiagnosis">Diagnóstico</Label>
                    <Input
                      id="historyDiagnosis"
                      value={medicalRecordForm.diagnosis}
                      onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, diagnosis: e.target.value })}
                      placeholder="Diagnóstico breve"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="historyNotes">Notas</Label>
                    <Textarea
                      id="historyNotes"
                      value={medicalRecordForm.notes}
                      onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, notes: e.target.value })}
                      placeholder="Notas detalladas de la consulta..."
                      rows={8}
                    />
                  </div>
                  <Button
                    onClick={() => createMedicalRecordMutation.mutate(medicalRecordForm)}
                    disabled={!medicalRecordForm.diagnosis && !medicalRecordForm.notes}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar en Historial
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial Médico ({medicalRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {medicalRecords.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No hay entradas en el historial médico
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {medicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 border rounded-lg border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{record.diagnosis || "Consulta"}</h4>
                            <span className="text-xs text-gray-500">{record.date}</span>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{record.notes}</p>
                          )}
                          <p className="text-xs text-gray-500">Médico: {record.doctorName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
