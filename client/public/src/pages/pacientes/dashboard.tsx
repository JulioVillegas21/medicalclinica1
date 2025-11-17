import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PatientQuickActions } from "@/components/PatientQuickActions";
import { parseLocalDate } from "@/lib/utils";

interface Appointment {
  id: string;
  patientName: string;
  patientDni: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: Date;
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: myAppointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/my-appointments"],
  });

  const upcomingAppointments = myAppointments.filter((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    return aptDate >= new Date() && apt.status !== 'cancelada';
  });

  const pastAppointments = myAppointments.filter((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    return aptDate < new Date() || apt.status === 'completada';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'confirmada': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      case 'completada': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'cancelada': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Hola, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido a tu portal de paciente
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{upcomingAppointments.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pastAppointments.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Total de Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{myAppointments.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Acciones Rápidas</h2>
          <PatientQuickActions />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>
              Tus citas médicas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Cargando citas...</p>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes citas programadas</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{apt.doctorName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {apt.reason}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(parseLocalDate(apt.date), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {apt.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Citas</CardTitle>
            <CardDescription>
              Tus citas anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes citas anteriores</p>
            ) : (
              <div className="space-y-4">
                {pastAppointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="border rounded-lg p-4 opacity-75"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{apt.doctorName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {apt.reason}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(parseLocalDate(apt.date), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {apt.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
