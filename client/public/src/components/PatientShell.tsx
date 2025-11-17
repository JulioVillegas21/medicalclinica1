import { Switch, Route } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import PatientDashboard from "@/pages/pacientes/dashboard";
import { LogOut, UserCircle, Settings } from "lucide-react";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { useState } from "react";

export function PatientShell() {
  const { logout, user } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen">
        <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Foto de perfil"
                  className="h-10 w-10 rounded-full object-cover border-2 border-violet-500"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Portal de Paciente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileDialogOpen(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Perfil
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </header>
        <main>
          <Switch>
            <Route path="/pacientes/dashboard" component={PatientDashboard} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
      </div>
  );
}
