import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Home className="w-3.5 h-3.5" />
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5" />
          {i === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <a href={item.href} className="hover:text-foreground cursor-pointer transition-colors">{item.label}</a>
          )}
        </span>
      ))}
    </nav>
  );
}
