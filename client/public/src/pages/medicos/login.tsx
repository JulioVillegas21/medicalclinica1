import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, ArrowLeft, Stethoscope } from "lucide-react";

export default function MedicosLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const result = await login(email, password, 'doctor');
    
    if (result.success) {
      toast({
        title: "¡Bienvenido!",
        description: "Sesión iniciada correctamente",
      });
      setLocation("/medicos/dashboard");
    } else {
      toast({
        title: "Error",
        description: result.error || "Credenciales incorrectas",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="absolute top-3 left-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Inicio
        </Button>
        <CardHeader className="space-y-1 text-center pt-12">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Stethoscope className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Portal de Médicos</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema médico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="medico@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700" 
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{" "}
              <span 
                onClick={() => setLocation("/medicos/registro")}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
              >
                Regístrate
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ¿Olvidaste tu usuario o contraseña?{" "}
              <span 
                onClick={() => setLocation("/medicos/recuperar-seleccion")}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
              >
                Recuperar acceso
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
