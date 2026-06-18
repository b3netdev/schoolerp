interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: "blue" | "emerald" | "amber" | "red" | "purple";
  size?: "sm" | "md";
}

const colorStyles = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
};

export function ProgressBar({ value, max = 100, label, showPercent = true, color = "blue", size = "md" }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showPercent && <span className="text-sm font-medium text-foreground">{percent}%</span>}
        </div>
      )}
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
