import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import PatientLogin from "@/pages/pacientes/login";
import PatientRegistration from "@/pages/pacientes/registro";
import VerifyEmail from "@/pages/pacientes/verificar-email";
import CompleteMedicalProfile from "@/pages/pacientes/completar-perfil";
import RecuperarSeleccion from "@/pages/pacientes/recuperar-seleccion";
import RecuperarUsuario from "@/pages/pacientes/recuperar-usuario";
import RecuperarPassword from "@/pages/pacientes/recuperar-password";
import ResetearPassword from "@/pages/pacientes/resetear-password";
import MedicosLogin from "@/pages/medicos/login";
import MedicosRegistro from "@/pages/medicos/registro";
import MedicosVerifyEmail from "@/pages/medicos/verificar-email";
import MedicosRecuperarSeleccion from "@/pages/medicos/recuperar-seleccion";
import MedicosRecuperarUsuario from "@/pages/medicos/recuperar-usuario";
import MedicosRecuperarPassword from "@/pages/medicos/recuperar-password";
import MedicosResetearPassword from "@/pages/medicos/resetear-password";
import { AdminShell } from "@/components/AdminShell";
import { PatientShell } from "@/components/PatientShell";
import { MedicosShell } from "@/components/MedicosShell";

function AppContent() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const publicPatientRoutes = [
    "/pacientes/login", 
    "/pacientes/registro", 
    "/pacientes/verificar-email",
    "/pacientes/completar-perfil",
    "/pacientes/recuperar-seleccion",
    "/pacientes/recuperar-usuario",
    "/pacientes/recuperar-password",
    "/pacientes/resetear-password"
  ];

  const publicMedicosRoutes = [
    "/medicos/login",
    "/medicos/registro",
    "/medicos/verificar-email",
    "/medicos/recuperar-seleccion",
    "/medicos/recuperar-usuario",
    "/medicos/recuperar-password",
    "/medicos/resetear-password"
  ];

  if (!user && !loading) {
    if (location !== "/" && location !== "/admin/login" && !publicPatientRoutes.includes(location) && !publicMedicosRoutes.includes(location)) {
      if (location.startsWith("/admin/")) {
        return <Redirect to="/admin/login" />;
      }
      if (location.startsWith("/pacientes/")) {
        return <Redirect to="/pacientes/login" />;
      }
      if (location.startsWith("/medicos/")) {
        return <Redirect to="/medicos/login" />;
      }
      return <Redirect to="/" />;
    }
  }

  if (user) {
    if (location === "/admin/login" && user.role === 'admin') {
      return <Redirect to="/admin/dashboard" />;
    }
    if (location === "/pacientes/login" && user.role === 'patient') {
      return <Redirect to="/pacientes/dashboard" />;
    }
    if (location === "/medicos/login" && user.role === 'doctor') {
      return <Redirect to="/medicos/dashboard" />;
    }

    if (location === "/") {
      if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
      if (user.role === 'patient') return <Redirect to="/pacientes/dashboard" />;
      if (user.role === 'doctor') return <Redirect to="/medicos/dashboard" />;
    }

    if (location.startsWith("/admin/") && user.role !== 'admin') {
      if (user.role === 'patient') return <Redirect to="/pacientes/dashboard" />;
      if (user.role === 'doctor') return <Redirect to="/medicos/dashboard" />;
    }

    if (location.startsWith("/pacientes/") && user.role !== 'patient') {
      if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
      if (user.role === 'doctor') return <Redirect to="/medicos/dashboard" />;
    }

    if (location.startsWith("/medicos/") && user.role !== 'doctor') {
      if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
      if (user.role === 'patient') return <Redirect to="/pacientes/dashboard" />;
    }
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin/login" component={Login} />
      <Route path="/pacientes/login" component={PatientLogin} />
      <Route path="/pacientes/registro" component={PatientRegistration} />
      <Route path="/pacientes/verificar-email" component={VerifyEmail} />
      <Route path="/pacientes/completar-perfil" component={CompleteMedicalProfile} />
      <Route path="/pacientes/recuperar-seleccion" component={RecuperarSeleccion} />
      <Route path="/pacientes/recuperar-usuario" component={RecuperarUsuario} />
      <Route path="/pacientes/recuperar-password" component={RecuperarPassword} />
      <Route path="/pacientes/resetear-password" component={ResetearPassword} />
      <Route path="/medicos/login" component={MedicosLogin} />
      <Route path="/medicos/registro" component={MedicosRegistro} />
      <Route path="/medicos/verificar-email" component={MedicosVerifyEmail} />
      <Route path="/medicos/recuperar-seleccion" component={MedicosRecuperarSeleccion} />
      <Route path="/medicos/recuperar-usuario" component={MedicosRecuperarUsuario} />
      <Route path="/medicos/recuperar-password" component={MedicosRecuperarPassword} />
      <Route path="/medicos/resetear-password" component={MedicosResetearPassword} />
      <Route path="/admin/:rest*">
        <ProtectedRoute requiredRole="admin">
          <AdminShell />
        </ProtectedRoute>
      </Route>
      <Route path="/pacientes/:rest*">
        <ProtectedRoute requiredRole="patient">
          <PatientShell />
        </ProtectedRoute>
      </Route>
      <Route path="/medicos/:rest*">
        <ProtectedRoute requiredRole="doctor">
          <MedicosShell />
        </ProtectedRoute>
      </Route>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
