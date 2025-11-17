import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function VerifyEmailMedicos() {
  const [, setLocation] = useLocation();
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    let intervalId: NodeJS.Timeout;

    const checkVerificationStatus = async () => {
      try {
        const response = await fetch(`/api/check-verification-status?token=${encodeURIComponent(token)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.email && !email) {
            setEmail(data.email);
          }
          if (data.verified) {
            setIsVerified(true);
            clearInterval(intervalId);
            setTimeout(() => {
              setLocation("/medicos/login");
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    intervalId = setInterval(checkVerificationStatus, 3000);
    checkVerificationStatus();

    return () => clearInterval(intervalId);
  }, [token, email, setLocation]);

  const handleResendEmail = async () => {
    if (!email) {
      alert("No se puede reenviar el email. Por favor, intenta registrarte nuevamente.");
      return;
    }

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert("Email de verificación reenviado. Revisa tu bandeja de entrada.");
      } else {
        alert("Error al reenviar el email. Intenta nuevamente.");
      }
    } catch (error) {
      alert("Error al reenviar el email.");
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-3 rounded-full animate-pulse">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-700">¡Email Verificado!</CardTitle>
            <CardDescription className="text-base">
              Tu cuenta ha sido activada correctamente
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-gray-600">
              Redirigiendo al inicio de sesión...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Revisa tu Email</CardTitle>
          <CardDescription className="text-base">
            Hemos enviado un enlace de verificación a tu correo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {email && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-gray-600 text-center mb-1">Email enviado a:</p>
              <p className="font-semibold text-center text-emerald-700">{email}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <p className="text-sm">Esperando verificación...</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-2">📧 Instrucciones:</p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Abre tu correo electrónico</li>
                <li>Busca el email de "Clínica Médica"</li>
                <li>Haz click en el botón "Verificar Email"</li>
                <li>Esta página se actualizará automáticamente</li>
              </ol>
            </div>

            <p className="text-xs text-gray-500 text-center">
              💡 Revisa tu carpeta de spam si no ves el correo
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendEmail}
            disabled={!email}
            className="w-full"
          >
            ¿No recibiste el email? Reenviar
          </Button>

          <div className="text-center text-sm text-gray-600">
            <Link href="/medicos/login" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
