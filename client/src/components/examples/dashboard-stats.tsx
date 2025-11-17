import { DashboardStats } from '../dashboard-stats';
import { Calendar, Users, Clock, DollarSign } from "lucide-react";

export default function DashboardStatsExample() {
  const mockStats = [
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
    {
      title: "Tiempo Promedio",
      value: "32 min",
      icon: <Clock className="w-4 h-4" />,
      trend: "-5 min vs semana",
    },
    {
      title: "Ingresos Hoy",
      value: "$12,450",
      icon: <DollarSign className="w-4 h-4" />,
      trend: "+18% vs ayer",
    },
  ];

  return <DashboardStats stats={mockStats} />;
}
