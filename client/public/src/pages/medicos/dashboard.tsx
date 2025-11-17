import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, CheckCircle2, ClipboardList, Play, Zap } from "lucide-react";

export default function MedicosDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const stats = [
    {
      title: "Citas de Hoy",
      value: "8",
      icon: <Calendar className="w-4 h-4" />,
      trend: "3 pendientes",
    },
    {
      title: "Pacientes Atendidos",
      value: "124",
      icon: <Users className="w-4 h-4" />,
      trend: "+15 este mes",
    },
    {
      title: "Próxima Cita",
      value: "14:30",
      icon: <Clock className="w-4 h-4" />,
      trend: "En 2 horas",
    },
    {
      title: "Citas Completadas",
      value: "95%",
      icon: <CheckCircle2 className="w-4 h-4" />,
      trend: "Este mes",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Portal de Médicos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bienvenido, Dr. {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-emerald-500"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-600" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 transition-all duration-300"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <ClipboardList className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Definir Horarios</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configura tu disponibilidad
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 transition-all duration-300"
                onClick={() => setLocation("/medicos/turnos")}
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Play className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Comenzar Turno</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inicia tu jornada laboral
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                <strong>Portal en Desarrollo:</strong> Esta es una versión inicial del portal de médicos. 
                Próximamente se agregarán funcionalidades para gestionar citas, ver historiales médicos 
                completos de pacientes y administrar su disponibilidad.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
