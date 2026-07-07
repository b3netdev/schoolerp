import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Save } from "lucide-react";
import useSection from "@/hooks/useSection";
export interface FieldDef {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "select"
    | "textarea"
    | "number"
    | "date"
    | "password"
    | "file"
    | "url";
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

const EMPTY_INITIAL_VALUES: Record<string, string> = {};

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialValues = EMPTY_INITIAL_VALUES,
  submitLabel = "Save",
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});


  useEffect(() => {
    if (!isOpen) return;

    const defaultValues: Record<string, string> = {};

    fields.forEach((field) => {
      defaultValues[field.key] = initialValues[field.key] ?? "";
    });

    setValues(defaultValues);
  }, [isOpen, fields, initialValues]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
    <form
      onSubmit={handleSubmit}
      data-testid="form-modal"
      className="flex max-h-[75vh] flex-col"
    >
      {/* Scrollable form body */}
      <div className="overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.key}
              className={field.type === "textarea" ? "sm:col-span-2" : ""}
            >
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>

              {field.type === "select" && field.options ? (
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid={`field-${field.key}`}
                >
                  <option value="">Select {field.label}</option>

                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={values[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  placeholder={
                    field.placeholder ?? `Enter ${field.label.toLowerCase()}`
                  }
                  rows={4}
                  className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  data-testid={`field-${field.key}`}
                />
              ) : (
                <input
                  type={field.type ?? "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  placeholder={
                    field.placeholder ?? `Enter ${field.label.toLowerCase()}`
                  }
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid={`field-${field.key}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="flex items-center justify-end gap-2 mt-6 pt-5 border-t border-border bg-card">
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