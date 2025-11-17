import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";

export interface ChartData {
  day: string;
  appointments: number;
}

const defaultData = [
  { day: 'Lun', appointments: 18 },
  { day: 'Mar', appointments: 24 },
  { day: 'Mié', appointments: 21 },
  { day: 'Jue', appointments: 28 },
  { day: 'Vie', appointments: 32 },
  { day: 'Sáb', appointments: 15 },
  { day: 'Dom', appointments: 12 },
];

export function AppointmentsChart({ data = defaultData }: { data?: ChartData[] }) {
  if (!data || data.length === 0) {
    data = defaultData;
  }
  
  const total = data.reduce((acc, curr) => acc + curr.appointments, 0);
  const average = data.length > 0 ? Math.round(total / data.length) : 0;
  const appointments = data.map(d => d.appointments);
  const max = appointments.length > 0 ? Math.max(...appointments) : 0;
  const min = appointments.length > 0 ? Math.min(...appointments) : 0;
  
  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Tendencia de Citas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Últimos 7 días</p>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+15%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              labelFormatter={(value) => `Día: ${value}`}
              formatter={(value) => [`${value} citas`, 'Citas']}
            />
            <Area 
              type="monotone" 
              dataKey="appointments" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCitas)" 
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Promedio</p>
            <p className="text-lg font-bold text-gray-900">{average}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Máximo</p>
            <p className="text-lg font-bold text-blue-600">{max}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className="text-lg font-bold text-amber-600">{min}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
