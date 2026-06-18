import { Activity } from "lucide-react";

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  time: string;
}

interface ActivityListProps {
  activities: ActivityItem[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="space-y-3" data-testid="activity-list">
      {activities.map((item, i) => (
        <div key={item.id} className="flex items-start gap-3 group">
          <div className="mt-0.5 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-snug">{item.action}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-muted-foreground">{item.user}</span>
              <span className="text-xs text-muted-foreground/60">·</span>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
