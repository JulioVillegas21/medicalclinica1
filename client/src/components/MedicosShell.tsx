import { Switch, Route, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import MedicosDashboard from "@/pages/medicos/dashboard";
import MedicosTurnos from "@/pages/medicos/turnos";
import MedicosConsulta from "@/pages/medicos/consulta";
import { LogOut, Stethoscope, Home } from "lucide-react";
import { useState } from "react";

export function MedicosShell() {
  const { logout, user } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const goToDashboard = () => {
    setLocation("/medicos/dashboard");
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
                className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Dr. {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Portal de Médicos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToDashboard}
              className="gap-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main>
        <Switch>
          <Route path="/medicos/dashboard" component={MedicosDashboard} />
          <Route path="/medicos/turnos" component={MedicosTurnos} />
          <Route path="/medicos/consulta/:appointmentId" component={MedicosConsulta} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}
