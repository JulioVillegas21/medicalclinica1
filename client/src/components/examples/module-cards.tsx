import { ModuleCards } from '../module-cards';
import { Calendar, Users, Stethoscope, Package, FileText, Settings } from "lucide-react";

export default function ModuleCardsExample() {
  const mockModules = [
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

  return <ModuleCards modules={mockModules} />;
}
