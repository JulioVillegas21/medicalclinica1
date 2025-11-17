import { DashboardStats } from "@/components/dashboard-stats";
import { TaskList } from "@/components/task-list";
import { AlertsPanel } from "@/components/alerts-panel";
import { ModuleCards } from "@/components/module-cards";
import { AppointmentsChart } from "@/components/appointments-chart";
import { Calendar, Users, Clock, DollarSign, Package, FileText, Settings, Stethoscope, Plus, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types";

export default function Home() {
  const stats = [
    {
      title: "Citas Hoy",
      value: "24",
      icon: <Calendar className="w-4 h-4" />,
      trend: "+12% vs ayer",
    },
    {
      title: "Pacientes Activos",
      value: "1,429",
      icon: <Users className="w-4 h-4" />,
      trend: "+8% este mes",
    },
  ];

  const tasks = [
    {
      id: "1",
      title: "Revisar inventario de medicamentos",
      description: "Verificar el stock de medicamentos esenciales y realizar pedidos necesarios. Revisar las fechas de vencimiento y actualizar el registro en el sistema.",
    },
    {
      id: "2",
      title: "Actualizar expedientes de pacientes",
      description: "Completar la digitalización de expedientes médicos pendientes del mes pasado. Asegurarse de que toda la información esté correctamente registrada en el sistema.",
    },
    {
      id: "3",
      title: "Confirmar citas de mañana",
      description: "Llamar o enviar mensajes a los pacientes con citas programadas para mañana para confirmar su asistencia y recordarles llegar 10 minutos antes.",
    },
    {
      id: "4",
      title: "Preparar reporte mensual",
      description: "Generar el reporte mensual de estadísticas de la clínica incluyendo: número de pacientes atendidos, especialidades más solicitadas, y métricas de satisfacción.",
    },
    {
      id: "5",
      title: "Revisar equipamiento de consultorios",
      description: "Inspeccionar el estado del equipamiento médico en todos los consultorios. Reportar cualquier equipo que necesite mantenimiento o reemplazo.",
    },
  ];

  const alerts = [
    {
      id: "1",
      type: "success" as const,
      message: "Nuevo médico en el equipo: Dr. Walter Lucero",
      time: "Hace 2 horas",
    },
    {
      id: "2",
      type: "info" as const,
      message: "Reunión de fin de año el 12 de diciembre",
      time: "Hace 4 horas",
    },
    {
      id: "3",
      type: "success" as const,
      message: "Inauguración de consultorio de pediatría",
      time: "Hace 1 día",
    },
    {
      id: "4",
      type: "info" as const,
      message: "Capacitación de personal médico este viernes",
      time: "Hace 2 días",
    },
  ];

  const modules = [
    {
      title: "Pacientes",
      description: "Gestión completa de historiales médicos y datos de pacientes",
      icon: Users,
      href: "#pacientes",
    },
    {
      title: "Citas",
      description: "Programación y seguimiento de citas médicas",
      icon: Calendar,
      href: "#citas",
    },
    {
      title: "Personal Médico",
      description: "Administración de médicos, horarios y turnos",
      icon: Stethoscope,
      href: "#personal",
    },
    {
      title: "Inventario",
      description: "Control de medicamentos y suministros médicos",
      icon: Package,
      href: "#inventario",
    },
    {
      title: "Reportes",
      description: "Generación de reportes y análisis estadísticos",
      icon: FileText,
      href: "#reportes",
    },
    {
      title: "Configuración",
      description: "Ajustes del sistema y preferencias",
      icon: Settings,
      href: "#configuracion",
    },
  ];

  const { data: user } = useQuery<Omit<User, 'password'>>({
    queryKey: ["/api/user"],
  });

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {getGreeting()}, {user?.firstName || 'Administrador'}
          </h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">{currentDate}</p>
        </div>
      </div>

      <DashboardStats stats={stats} />

      <AppointmentsChart />

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskList tasks={tasks} />
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}
