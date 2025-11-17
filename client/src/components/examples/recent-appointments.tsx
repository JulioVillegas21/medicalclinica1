import { RecentAppointments } from '../recent-appointments';

export default function RecentAppointmentsExample() {
  const mockAppointments = [
    {
      id: "1",
      patientName: "María García López",
      time: "09:00",
      doctor: "Rodríguez",
      status: "confirmed" as const,
    },
    {
      id: "2",
      patientName: "Juan Pérez Sánchez",
      time: "10:30",
      doctor: "Martínez",
      status: "pending" as const,
    },
    {
      id: "3",
      patientName: "Ana Torres Díaz",
      time: "11:00",
      doctor: "López",
      status: "completed" as const,
    },
    {
      id: "4",
      patientName: "Carlos Ruiz Fernández",
      time: "12:00",
      doctor: "Gómez",
      status: "confirmed" as const,
    },
  ];

  return <RecentAppointments appointments={mockAppointments} />;
}
