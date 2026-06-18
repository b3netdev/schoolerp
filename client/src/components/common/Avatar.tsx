interface AvatarProps {
  src?: string;
  initials?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeStyles = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-lg",
};

const colorOptions = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colorOptions[Math.abs(hash) % colorOptions.length];
}

export function Avatar({ src, initials, name = "", size = "md", color }: AvatarProps) {
  const bgColor = color || getColor(name || initials || "?");
  const display = initials || (name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?");

  return (
    <div className={`${sizeStyles[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 overflow-hidden ${!src ? bgColor : ""}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{display}</span>
      )}
    </div>
  );
}
