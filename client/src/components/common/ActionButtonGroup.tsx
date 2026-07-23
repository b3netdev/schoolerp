import {
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

type ActionButtonGroupProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  disabled?: boolean;
  className?: string;
};

export const ActionButtonGroup = ({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  disabled = false,
  className,
}: ActionButtonGroupProps) => {
  const hasActions =
    onView ||
    onEdit ||
    onDelete ||
    onRestore ||
    onPermanentDelete;

  if (!hasActions) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn("inline-flex", className)}
      aria-label="Record actions"
    >
      {onView && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onView}
          title="View"
          aria-label="View record"
          className="h-8 w-8 cursor-pointer"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {onEdit && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onEdit}
          title="Edit"
          aria-label="Edit record"
          className="h-8 w-8 cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {onRestore && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onRestore}
          title="Restore"
          aria-label="Restore record"
          className="h-8 w-8 cursor-pointer text-green-600 hover:text-green-700"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}

      {onDelete && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onDelete}
          title="Delete"
          aria-label="Delete record"
          className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      {onPermanentDelete && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          disabled={disabled}
          onClick={onPermanentDelete}
          title="Permanently delete"
          aria-label="Permanently delete record"
          className="h-8 w-8 cursor-pointer"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </ButtonGroup>
  );
};