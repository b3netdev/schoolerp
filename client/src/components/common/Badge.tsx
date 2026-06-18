interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  danger: "bg-red-100 text-red-700 border border-red-200",
  info: "bg-blue-100 text-blue-700 border border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
      data-testid={`badge-${variant}`}
    >
      {children}
    </span>
  );
}

export function statusToBadgeVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toLowerCase();
  if (s === "active" || s === "present" || s === "paid" || s === "pass") return "success";
  if (s === "pending" || s === "late") return "warning";
  if (s === "inactive" || s === "absent" || s === "unpaid" || s === "fail" || s === "blocked") return "danger";
  if (s === "info") return "info";
  return "neutral";
}
