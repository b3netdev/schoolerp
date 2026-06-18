import { Modal } from "./Modal";
import { Trash2, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record",
  description = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmLabel = "Delete",
  variant = "danger",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4" data-testid="confirm-modal">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          variant === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
        }`}>
          {variant === "danger" ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-2 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors"
            data-testid="confirm-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition-opacity hover:opacity-90 ${
              variant === "danger" ? "bg-red-600" : "bg-amber-500"
            }`}
            data-testid="confirm-delete"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
