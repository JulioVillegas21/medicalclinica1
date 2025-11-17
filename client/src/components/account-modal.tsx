import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Camera, Lock, User as UserIcon, Mail } from "lucide-react";
import type { User } from "@/types";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileUpdatePassword, setProfileUpdatePassword] = useState("");
  const [photoUpdatePassword, setPhotoUpdatePassword] = useState("");

  const { data: user } = useQuery<Omit<User, 'password'>>({
    queryKey: ["/api/user"],
    enabled: open,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      });
      setHasChanges(false);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { currentPassword?: string }) => {
      return await apiRequest("PATCH", `/api/user/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Datos actualizados",
        description: "Tus datos se han actualizado correctamente",
      });
      setHasChanges(false);
      setProfileUpdatePassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar los datos",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (user) {
      const isChanged = 
        newFormData.firstName !== user.firstName ||
        newFormData.lastName !== user.lastName ||
        newFormData.phone !== user.phone ||
        newFormData.email !== user.email;
      setHasChanges(isChanged);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo pacientes necesitan contraseña, admins no
    if (user?.role === 'patient' && !profileUpdatePassword.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese su contraseña para confirmar los cambios",
        variant: "destructive",
      });
      return;
    }
    
    // Incluir contraseña solo si el usuario es paciente
    const updatePayload = user?.role === 'patient' 
      ? { ...formData, currentPassword: profileUpdatePassword }
      : formData;
    
    updateMutation.mutate(updatePayload);
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar contraseña");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: async (data: { profileImage: string; currentPassword?: string }) => {
      const response = await fetch(`/api/user/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar foto de perfil");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setProfileImageUrl("");
      setPhotoUpdatePassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleUpdateProfileImage = () => {
    if (!profileImageUrl.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese una URL de imagen",
        variant: "destructive",
      });
      return;
    }

    // Solo pacientes necesitan contraseña, admins no
    if (user?.role === 'patient' && !photoUpdatePassword.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese su contraseña para confirmar el cambio",
        variant: "destructive",
      });
      return;
    }

    // Incluir contraseña solo si el usuario es paciente
    const updatePayload = user?.role === 'patient'
      ? { profileImage: profileImageUrl, currentPassword: photoUpdatePassword }
      : { profileImage: profileImageUrl };

    updateProfileImageMutation.mutate(updatePayload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mi Cuenta</DialogTitle>
          <DialogDescription>
            Gestiona tu información personal y seguridad
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="photo">Foto</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Ingresa tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Ingresa tu apellido"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              {user?.role === 'patient' && (
                <div className="space-y-2">
                  <Label htmlFor="profileUpdatePassword">
                    <Lock className="h-4 w-4 inline mr-2" />
                    Contraseña actual
                  </Label>
                  <Input
                    id="profileUpdatePassword"
                    type="password"
                    value={profileUpdatePassword}
                    onChange={(e) => setProfileUpdatePassword(e.target.value)}
                    placeholder="Ingresa tu contraseña para confirmar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Por seguridad, confirma tu contraseña antes de guardar cambios
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!hasChanges || updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="photo" className="space-y-4">
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Foto de perfil"
                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="photoUrl">
                  <Camera className="h-4 w-4 inline mr-2" />
                  URL de la imagen
                </Label>
                <Input
                  id="photoUrl"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">Ingresa la URL de tu foto de perfil</p>
              </div>
              {user?.role === 'patient' && (
                <div className="space-y-2">
                  <Label htmlFor="photoUpdatePassword">
                    <Lock className="h-4 w-4 inline mr-2" />
                    Contraseña actual
                  </Label>
                  <Input
                    id="photoUpdatePassword"
                    type="password"
                    value={photoUpdatePassword}
                    onChange={(e) => setPhotoUpdatePassword(e.target.value)}
                    placeholder="Ingresa tu contraseña para confirmar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Por seguridad, confirma tu contraseña antes de actualizar tu foto
                  </p>
                </div>
              )}
              <Button
                onClick={handleUpdateProfileImage}
                disabled={updateProfileImageMutation.isPending}
                className="w-full"
              >
                {updateProfileImageMutation.isPending ? "Actualizando..." : "Actualizar Foto"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Contraseña actual
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                className="w-full"
              >
                {changePasswordMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
