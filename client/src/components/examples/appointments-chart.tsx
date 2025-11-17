import { AppointmentsChart } from '../appointments-chart';

export default function AppointmentsChartExample() {
  const mockData = [
    { day: "Lun", appointments: 22 },
    { day: "Mar", appointments: 18 },
    { day: "Mié", appointments: 25 },
    { day: "Jue", appointments: 20 },
    { day: "Vie", appointments: 24 },
    { day: "Sáb", appointments: 12 },
    { day: "Dom", appointments: 8 },
  ];

  return <AppointmentsChart data={mockData} />;
}
