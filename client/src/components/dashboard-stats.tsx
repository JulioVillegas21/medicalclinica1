import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  gradient: string;
  iconBg: string;
}

export function StatCard({ title, value, icon, trend, gradient, iconBg }: StatCardProps) {
  const isPositive = trend?.includes('+');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className={`relative overflow-hidden border-0 shadow-lg ${gradient}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-2">{title}</p>
              <div className="text-4xl font-bold text-white mb-3" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
                {value}
              </div>
              {trend && (
                <div className="flex items-center gap-1 text-white/90">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{trend}</span>
                </div>
              )}
            </div>
            <div className={`${iconBg} p-3 rounded-xl shadow-md`}>
              <div className="text-white w-6 h-6">
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export interface DashboardStatsProps {
  stats: Array<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    gradient?: string;
    iconBg?: string;
  }>;
}

const defaultGradients = [
  "bg-gradient-to-br from-blue-500 to-blue-600",
  "bg-gradient-to-br from-emerald-500 to-emerald-600",
  "bg-gradient-to-br from-amber-500 to-amber-600",
  "bg-gradient-to-br from-purple-500 to-purple-600",
];

const defaultIconBgs = [
  "bg-blue-600/50",
  "bg-emerald-600/50",
  "bg-amber-600/50",
  "bg-purple-600/50",
];

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard 
          key={index} 
          {...stat} 
          gradient={stat.gradient || defaultGradients[index % defaultGradients.length]}
          iconBg={stat.iconBg || defaultIconBgs[index % defaultIconBgs.length]}
        />
      ))}
    </div>
  );
}
