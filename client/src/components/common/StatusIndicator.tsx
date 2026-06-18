interface StatusIndicatorProps {
  status: "active" | "inactive" | "pending" | "blocked" | string;
  showLabel?: boolean;
}

const statusConfig: Record<string, { dot: string; label: string; text: string }> = {
  active: { dot: "bg-emerald-500", label: "Active", text: "text-emerald-700" },
  inactive: { dot: "bg-gray-400", label: "Inactive", text: "text-gray-500" },
  pending: { dot: "bg-amber-500", label: "Pending", text: "text-amber-700" },
  blocked: { dot: "bg-red-500", label: "Blocked", text: "text-red-700" },
};

export function StatusIndicator({ status, showLabel = true }: StatusIndicatorProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.inactive;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {showLabel && <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>}
    </span>
  );
}
