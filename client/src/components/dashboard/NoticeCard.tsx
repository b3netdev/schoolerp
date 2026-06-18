import { Badge } from "@/components/common/Badge";
import { Calendar } from "lucide-react";

interface NoticeCardProps {
  title: string;
  date: string;
  audience: string;
  description: string;
}

function audienceToBadge(audience: string): "info" | "warning" | "success" | "neutral" {
  if (audience === "All") return "info";
  if (audience === "Teachers") return "warning";
  if (audience === "Students") return "success";
  return "neutral";
}

export function NoticeCard({ title, date, audience, description }: NoticeCardProps) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow" data-testid="notice-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-foreground leading-snug">{title}</h3>
        <Badge variant={audienceToBadge(audience)} className="flex-shrink-0">{audience}</Badge>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{description}</p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span>{date}</span>
      </div>
    </div>
  );
}
