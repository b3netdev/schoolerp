import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "emerald" | "amber" | "purple" | "rose";
}

const colorStyles: Record<string, { bg: string; icon: string; iconBg: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", iconBg: "bg-blue-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", iconBg: "bg-emerald-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", iconBg: "bg-amber-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", iconBg: "bg-purple-100" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", iconBg: "bg-rose-100" },
};

export function StatCard({ icon, title, value, change, trend = "neutral", color = "blue" }: StatCardProps) {
  const c = colorStyles[color];
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow" data-testid="stat-card">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
          }`}>
            {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      </div>
    </div>
  );
}
