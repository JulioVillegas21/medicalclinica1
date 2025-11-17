import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CompleteMedicalProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    bloodType: "",
    healthInsurance: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [allergies, setAllergies] = useState<string[]>([]);
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData & { 
      allergies: string[], 
      chronicConditions: string[], 
      currentMedications: string[] 
    }) => {
      const response = await fetch("/api/patient/medical-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar perfil");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil completado",
        description: "Tu perfil médico ha sido guardado correctamente.",
      });
      setLocation("/pacientes/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      ...formData,
      allergies,
      chronicConditions,
      currentMedications,
    });
  };

  const addItem = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, resetInput: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      resetInput("");
    }
  };

  const removeItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkip = () => {
    toast({
      title: "Perfil omitido",
      description: "Puedes completar tu perfil médico más tarde.",
    });
    setLocation("/pacientes/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <ClipboardList className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Completa tu Perfil Médico</CardTitle>
          <CardDescription className="text-base">
            Esta información ayudará a los médicos a brindarte mejor atención
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Grupo Sanguíneo</Label>
                <Select
                  value={formData.bloodType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthInsurance">Obra Social</Label>
                <Input
                  id="healthInsurance"
                  placeholder="OSDE, Swiss Medical, etc."
                  value={formData.healthInsurance}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthInsurance: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Alergias</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Penicilina, Polen..."
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(newAllergy, setAllergies, setNewAllergy);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem(newAllergy, setAllergies, setNewAllergy)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeItem(index, setAllergies)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Condiciones Crónicas</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Diabetes, Hipertensión..."
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(newCondition, setChronicConditions, setNewCondition);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem(newCondition, setChronicConditions, setNewCondition)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {chronicConditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeItem(index, setChronicConditions)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Medicación Actual</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Aspirina 100mg, Losartán..."
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(newMedication, setCurrentMedications, setNewMedication);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem(newMedication, setCurrentMedications, setNewMedication)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentMedications.map((medication, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeItem(index, setCurrentMedications)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Nombre</Label>
                  <Input
                    id="emergencyContactName"
                    placeholder="Nombre completo"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Teléfono</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    placeholder="+54 11 1234-5678"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Guardando..." : "Guardar Perfil"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
            >
              Completar más tarde
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
