import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Key } from "lucide-react";

export default function RecuperarPasswordMedicos() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setCodeSent(true);
      toast({
        title: "Código enviado",
        description: "Si el email existe, recibirás un código de recuperación",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al procesar la solicitud. Intenta nuevamente.",
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
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Key className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
          <CardDescription>
            {!codeSent 
              ? "Ingresa tu email para recibir un código de recuperación" 
              : "Revisa tu email para continuar"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!codeSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Te enviaremos un código de 6 dígitos a tu correo electrónico
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Código"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Código enviado
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Si el email <span className="font-semibold">{email}</span> está registrado, 
                  recibirás un código de recuperación en los próximos minutos.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>⏱️ El código expira en 15 minutos</strong>
                  <br />
                  Revisa tu bandeja de entrada y spam.
                </p>
              </div>

              <Button 
                onClick={() => setLocation("/medicos/resetear-password")} 
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                Continuar con el Código
              </Button>

              <Button 
                onClick={() => setCodeSent(false)} 
                variant="outline"
                className="w-full"
              >
                Enviar a otro email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            ¿Olvidaste tu email?{" "}
            <Link href="/medicos/recuperar-usuario">
              <span className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline cursor-pointer">
                Recuperar usuario
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
