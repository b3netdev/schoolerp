import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Save } from "lucide-react";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, string>;
  submitLabel?: string;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialValues = {},
  submitLabel = "Save",
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, string> = {};
      fields.forEach(f => {
        defaults[f.key] = initialValues[f.key] ?? "";
      });
      setValues(defaults);
    }
  }, [isOpen, initialValues]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} data-testid="form-modal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.key} className={field.type === "select" ? "" : ""}>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.type === "select" && field.options ? (
                <select
                  value={values[field.key] ?? ""}
                  onChange={e => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid={`field-${field.key}`}
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.key] ?? ""}
                  onChange={e => handleChange(field.key, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid={`field-${field.key}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-5 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors"
            data-testid="form-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="form-submit"
          >
            <Save className="w-4 h-4" />
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
