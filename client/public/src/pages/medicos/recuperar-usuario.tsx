import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, FileText } from "lucide-react";

export default function RecuperarUsuarioMedicos() {
  const [matricula, setMatricula] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricula || matricula.length < 1) {
      toast({
        title: "Error",
        description: "Por favor ingresa una matrícula válida",
        variant: "destructive",
      });
      return;
    }

    if (!matricula.startsWith('1') || !matricula.endsWith('3')) {
      toast({
        title: "Error",
        description: "La matrícula no es válida o no pertenece a un médico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/recover-username-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matricula }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      setSubmitted(true);
      toast({
        title: "Solicitud procesada",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar la solicitud. Intenta nuevamente.",
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
          onClick={() => setLocation("/medicos/recuperar-seleccion")}
          className="absolute top-3 left-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Volver
        </Button>
        
        <CardHeader className="space-y-1 text-center pt-12">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Mail className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Usuario</CardTitle>
          <CardDescription>
            Ingresa tu matrícula para recuperar tu email
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="matricula"
                    type="text"
                    placeholder="Ingrese su matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresa tu número de matrícula profesional
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                disabled={loading}
              >
                {loading ? "Procesando..." : "Recuperar Email"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Solicitud procesada
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Si tu matrícula está registrada en nuestro sistema, recibirás un email con 
                  tu dirección de correo electrónico en los próximos minutos.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>📧 Revisa tu bandeja de entrada</strong>
                  <br />
                  Si no recibes el email, verifica la carpeta de spam o contacta a la clínica.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>🔒 Por seguridad:</strong> No confirmamos si una matrícula está registrada. 
                  Solo recibirás un email si tu matrícula existe en nuestro sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setLocation("/medicos/login")} 
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                >
                  Ir al Login
                </Button>
                <Button 
                  onClick={() => {
                    setSubmitted(false);
                    setMatricula("");
                  }} 
                  variant="outline"
                  className="w-full"
                >
                  Buscar otra Matrícula
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            ¿Necesitas recuperar tu contraseña?{" "}
            <Link href="/medicos/recuperar-password">
              <span className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline cursor-pointer">
                Recuperar contraseña
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
