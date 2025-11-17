import { AlertsPanel } from '../alerts-panel';

export default function AlertsPanelExample() {
  const mockAlerts = [
    {
      id: "1",
      type: "warning" as const,
      message: "Cita de María García sin confirmar",
      time: "Hace 5 min",
    },
    {
      id: "2",
      type: "info" as const,
      message: "Nueva cita programada para mañana",
      time: "Hace 15 min",
    },
    {
      id: "3",
      type: "success" as const,
      message: "Inventario actualizado correctamente",
      time: "Hace 1 hora",
    },
    {
      id: "4",
      type: "warning" as const,
      message: "Stock bajo en medicamento X",
      time: "Hace 2 horas",
    },
  ];

  return <AlertsPanel alerts={mockAlerts} />;
}
