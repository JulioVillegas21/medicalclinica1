import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'patient' | 'doctor';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    if (requiredRole === 'patient' || location.startsWith("/pacientes/")) {
      return <Redirect to="/pacientes/login" />;
    }
    if (requiredRole === 'doctor' || location.startsWith("/medicos/")) {
      return <Redirect to="/medicos/login" />;
    }
    return <Redirect to="/admin/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') {
      return <Redirect to="/admin/dashboard" />;
    }
    if (user.role === 'doctor') {
      return <Redirect to="/medicos/dashboard" />;
    }
    return <Redirect to="/pacientes/dashboard" />;
  }

  return <>{children}</>;
}
