import { Badge } from "@/components/common/Badge";
import { CalendarDays } from "lucide-react";

interface CalendarCardProps {
  title: string;
  date: string;
  type: string;
}

function typeToBadge(type: string): "info" | "warning" | "success" | "neutral" | "danger" {
  if (type === "Academic") return "info";
  if (type === "Holiday") return "success";
  if (type === "Meeting") return "warning";
  if (type === "Sports") return "danger";
  if (type === "Cultural") return "neutral";
  return "neutral";
}

export function CalendarCard({ title, date, type }: CalendarCardProps) {
  const [year, month, day] = date.split("-");
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short" });

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow" data-testid="calendar-card">
      <div className="w-11 h-11 bg-primary/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-primary uppercase">{monthName}</span>
        <span className="text-base font-bold text-primary leading-none">{day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <Badge variant={typeToBadge(type)} className="mt-1">{type}</Badge>
      </div>
    </div>
  );
}
