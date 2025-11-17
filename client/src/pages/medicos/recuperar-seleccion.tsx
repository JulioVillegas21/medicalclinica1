import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Key, HelpCircle } from "lucide-react";

export default function RecuperarSeleccionMedicos() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl shadow-xl relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/medicos/login")}
          className="absolute top-3 left-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Volver al Login
        </Button>
        
        <CardHeader className="space-y-1 text-center pt-12">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <HelpCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">¿Qué necesitas recuperar?</CardTitle>
          <CardDescription>
            Selecciona la opción que necesites
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-300 border-2"
            onClick={() => setLocation("/medicos/recuperar-usuario")}
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Recuperar Usuario (Email)</h3>
                  <p className="text-sm text-muted-foreground">
                    ¿Olvidaste tu email? Ingresa tu matrícula y te enviaremos tu dirección de correo electrónico por email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-300 border-2"
            onClick={() => setLocation("/medicos/recuperar-password")}
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Recuperar Contraseña</h3>
                  <p className="text-sm text-muted-foreground">
                    ¿Olvidaste tu contraseña? Te enviaremos un código de verificación a tu email para que puedas crear una nueva.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
