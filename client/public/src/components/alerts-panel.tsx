import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface Alert {
  id: string;
  type: "info" | "warning" | "success";
  message: string;
  time: string;
}

const alertConfig = {
  info: { 
    icon: Bell, 
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100"
  },
  warning: { 
    icon: AlertCircle, 
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100"
  },
  success: { 
    icon: CheckCircle, 
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100"
  },
};

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
        <div>
          <CardTitle className="text-xl">Notificaciones</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Actualizaciones recientes</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const Icon = alertConfig[alert.type].icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`flex gap-3 p-4 rounded-xl border ${alertConfig[alert.type].bg} ${alertConfig[alert.type].border} group hover:shadow-md transition-all duration-200`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className={`${alertConfig[alert.type].iconBg} p-2 rounded-lg h-fit`}>
                    <Icon className={`w-4 h-4 ${alertConfig[alert.type].color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
