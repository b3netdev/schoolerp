import { Avatar } from "@/components/common/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/common/Badge";
import { Mail, Phone, BookOpen, Users } from "lucide-react";

interface InfoRow {
  icon?: React.ReactNode;
  label: string;
  value: string;
}

interface ProfileInfoCardProps {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  extra?: InfoRow[];
  status?: string;
  initials?: string;
}

export function ProfileInfoCard({ name, role, email, phone, extra = [], status, initials }: ProfileInfoCardProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <Avatar initials={initials} name={name} size="lg" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{role}</p>
        {status && (
          <div className="mt-2 flex justify-center">
            <Badge variant={statusToBadgeVariant(status)}>{status}</Badge>
          </div>
        )}
      </div>
      <div className="w-full border-t border-border pt-4 space-y-3 text-left">
        {email && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm text-foreground font-medium">{email}</p>
            </div>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm text-foreground font-medium">{phone}</p>
            </div>
          </div>
        )}
        {extra.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
              {row.icon || <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-sm text-foreground font-medium">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
