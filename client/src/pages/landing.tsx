import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Activity, Users, Clock, CheckCircle2, Sparkles, UserRound, Stethoscope } from "lucide-react";
import equipoProfesionalImg from "@assets/fac_1763240698689.jpg";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/20 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="relative container mx-auto px-4 py-12">
        <div className="flex flex-col items-center space-y-20">
          
          <div className="grid md:grid-cols-2 gap-12 items-center w-full max-w-7xl pt-8">
            <div className="space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-3 bg-sky-100/80 dark:bg-sky-900/30 px-4 py-2 rounded-full backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-medium text-sky-700 dark:text-sky-300">Sistema de Gestión Médica</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">
                    Clínica Médica
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
                  Gestión integral y profesional para el cuidado de la salud
                </p>
              </div>

              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tecnología avanzada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Atención 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Personal especializado</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-400 to-teal-400 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-200/50 dark:ring-gray-800">
                <img 
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
                  alt="Clínica Médica - Instalaciones"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-900/80 via-sky-900/20 to-transparent"></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
            <div className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-800/50">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <Activity className="h-10 w-10 text-sky-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Atención Inmediata</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Servicio de urgencias disponible las 24 horas</p>
              </div>
            </div>

            <div className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-800/50">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <Users className="h-10 w-10 text-teal-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Equipo Experto</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Profesionales altamente calificados</p>
              </div>
            </div>

            <div className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-800/50">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <Clock className="h-10 w-10 text-sky-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Turnos Online</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Sistema de gestión de citas eficiente</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-3xl space-y-6">
            <div 
              onClick={() => setLocation("/admin/login")}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 via-teal-500 to-sky-500 rounded-3xl blur opacity-40 group-hover:opacity-100 transition duration-500 animate-gradient-x"></div>
              
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-teal-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-sky-500 to-teal-600 p-6 rounded-2xl shadow-lg">
                        <Shield className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Portal de Administración
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Acceso seguro para personal administrativo
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="inline-flex items-center gap-1 text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Gestión de citas
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Control de consultorios
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Reportes y estadísticas
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                      onClick={() => setLocation("/admin/login")}
                    >
                      <span className="mr-2">Acceder</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setLocation("/pacientes/login")}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 rounded-3xl blur opacity-40 group-hover:opacity-100 transition duration-500 animate-gradient-x"></div>
              
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-2xl shadow-lg">
                        <UserRound className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Portal de Pacientes
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Consulta tus citas y gestiona tu historial médico
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Mis citas
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Historial médico
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Perfil personal
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                      onClick={() => setLocation("/pacientes/login")}
                    >
                      <span className="mr-2">Acceder</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setLocation("/medicos/login")}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 rounded-3xl blur opacity-40 group-hover:opacity-100 transition duration-500 animate-gradient-x"></div>
              
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl shadow-lg">
                        <Stethoscope className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Portal de Médicos
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Gestiona tus consultas y agenda profesional
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Mis pacientes
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Agenda de citas
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Horarios
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                      onClick={() => setLocation("/medicos/login")}
                    >
                      <span className="mr-2">Acceder</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl pb-12">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=1791&auto=format&fit=crop"
                alt="Consultorios modernos"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent flex items-end">
                <div className="p-6 w-full">
                  <h3 className="text-xl font-bold text-white mb-1">Instalaciones Modernas</h3>
                  <p className="text-gray-200 text-sm">Equipamiento de última tecnología</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-gray-100 dark:bg-gray-800">
              <img 
                src={equipoProfesionalImg}
                alt="Equipo médico profesional"
                className="w-full h-64 object-contain group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent flex items-end">
                <div className="p-6 w-full">
                  <h3 className="text-xl font-bold text-white mb-1">Equipo Profesional</h3>
                  <p className="text-gray-200 text-sm">Médicos especialistas certificados</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=2073&auto=format&fit=crop"
                alt="Atención personalizada"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent flex items-end">
                <div className="p-6 w-full">
                  <h3 className="text-xl font-bold text-white mb-1">Atención Personalizada</h3>
                  <p className="text-gray-200 text-sm">Cuidado centrado en el paciente</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
