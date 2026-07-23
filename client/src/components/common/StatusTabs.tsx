import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

export type StatusTabOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
};

type StatusTabsProps<T extends string> = {
  options: StatusTabOption<T>[];
  value: T;
  onChange: (value: T) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

export const StatusTabs = <T extends string,>({
  options,
  value,
  onChange,
  disabled = false,
  className,
}: StatusTabsProps<T>) => {
  return (
    <ButtonGroup
      className={cn("flex flex-wrap", className)}
      aria-label="Status filter"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            disabled={disabled || option.disabled}
            aria-pressed={isActive}
            className="cursor-pointer"
            onClick={() => {
              if (!isActive) {
                void onChange(option.value);
              }
            }}
          >
            <span>{option.label}</span>

            {typeof option.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            )}
          </Button>
        );
      })}
    </ButtonGroup>
  );
};