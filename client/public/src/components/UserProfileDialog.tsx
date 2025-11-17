import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Camera, Lock, User, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profileUpdatePassword, setProfileUpdatePassword] = useState("");
  const [photoUpdatePassword, setPhotoUpdatePassword] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
    }
  }, [user]);

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
      checkAuth();
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; currentPassword: string }) => {
      const response = await fetch("/api/user/update-profile", {
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
    onSuccess: (data) => {
      setProfileUpdatePassword("");
      if (data.emailChanged) {
        toast({
          title: "Email actualizado",
          description: "Tu sesión se cerrará. Verifica tu nuevo email para acceder nuevamente.",
          duration: 5000,
        });
        onOpenChange(false);
        setTimeout(() => {
          window.location.href = "/pacientes/login";
        }, 2000);
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada exitosamente",
        });
        checkAuth();
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
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

    // Solo pacientes necesitan contraseña
    if (user?.role === 'patient' && !photoUpdatePassword.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese su contraseña para confirmar el cambio",
        variant: "destructive",
      });
      return;
    }

    // Incluir contraseña solo si el usuario es paciente
    const payload = user?.role === 'patient'
      ? { profileImage: profileImageUrl, currentPassword: photoUpdatePassword }
      : { profileImage: profileImageUrl };

    updateProfileImageMutation.mutate(payload);
  };

  const handleUpdateProfile = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Error",
        description: "Por favor ingrese un email válido",
        variant: "destructive",
      });
      return;
    }

    if (!profileUpdatePassword.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese su contraseña para confirmar los cambios",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({ firstName, lastName, email, currentPassword: profileUpdatePassword });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Perfil de Usuario</DialogTitle>
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
            <div className="space-y-4 py-4">
              {user?.role === 'patient' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      <User className="h-4 w-4 inline mr-2" />
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      <User className="h-4 w-4 inline mr-2" />
                      Apellido
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tu apellido"
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                    />
                    {email !== user?.email && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Si cambias tu email, deberás verificarlo nuevamente
                      </p>
                    )}
                  </div>
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
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <User className="h-4 w-4 inline mr-2" />
                      Nombre
                    </Label>
                    <Input
                      id="name"
                      value={`${user?.firstName} ${user?.lastName}`}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500">Solo pacientes pueden modificar su perfil</p>
                  </div>
                </>
              )}
            </div>
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
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
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
