import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Stethoscope, CreditCard, Calendar, Clock } from "lucide-react";
import type { Doctor } from "@/types";

interface OfficeAssignment {
  id: string;
  officeId: string;
  officeName: string;
  doctorId: string;
  doctorName: string;
  month: number;
  year: number;
  weekDays: number[];
  startTime: string;
  endTime: string;
  createdAt: Date;
}

interface DoctorInfoPanelProps {
  doctor: Doctor;
  assignments: OfficeAssignment[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "DOM" },
  { value: 1, label: "LUN" },
  { value: 2, label: "MAR" },
  { value: 3, label: "MIÉ" },
  { value: 4, label: "JUE" },
  { value: 5, label: "VIE" },
  { value: 6, label: "SÁB" },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function DoctorInfoPanel({ doctor, assignments }: DoctorInfoPanelProps) {
  const doctorAssignments = assignments.filter(a => a.doctorId === doctor.id);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Información del Médico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nombre Completo</p>
              <p className="text-sm text-muted-foreground">
                {doctor.firstName} {doctor.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Stethoscope className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Especialidad</p>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CreditCard className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Matrícula</p>
              <p className="text-sm text-muted-foreground">{doctor.matricula}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">Disponibilidad Actual</p>
          </div>
          
          {doctorAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin asignaciones activas
            </p>
          ) : (
            <div className="space-y-3">
              {doctorAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{assignment.officeName}</p>
                    <Badge variant="outline" className="text-xs">
                      {MONTHS[assignment.month - 1]} {assignment.year}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{assignment.startTime} - {assignment.endTime}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {assignment.weekDays.map((day) => {
                      const dayInfo = DAYS_OF_WEEK.find(d => d.value === day);
                      return (
                        <Badge
                          key={day}
                          variant="secondary"
                          className="text-xs px-2 py-0"
                        >
                          {dayInfo?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
