import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  Save,
} from "lucide-react";

import { Modal } from "./Modal";
import useCheck from "@/hooks/useCheck";

type CheckExistConfig = {
  at: string;
};

type CheckState =
  | "idle"
  | "checking"
  | "valid"
  | "invalid";

type FieldCheckStatus = {
  state: CheckState;
  message: string;
};

/*
 * Normal fields contain strings.
 * Checkbox fields contain boolean values.
 */
export type FormValue = string | boolean;

export type FormValues = Record<string, FormValue>;

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
    | "url"
    | "checkbox";

  options?: {
    label: string;
    value: string | boolean;
  }[];

  required?: boolean;
  placeholder?: string;

  checkExistAt?: CheckExistConfig[];
}


export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
  title: string;
  fields: FieldDef[];
  initialValues?: FormValues;
  submitLabel?: string;
}

const EMPTY_INITIAL_VALUES: FormValues = {};

const EMPTY_CHECK_STATUS: FieldCheckStatus = {
  state: "idle",
  message: "",
};

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialValues = EMPTY_INITIAL_VALUES,
  submitLabel = "Save",
}: FormModalProps) {
  const [values, setValues] = useState<FormValues>({});

  const [fieldStatuses, setFieldStatuses] = useState<
    Record<string, FieldCheckStatus>
  >({});

  const { checkExists } = useCheck();

  /*
   * Separate debounce timer for every field.
   */
  const debounceTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  /*
   * Prevent an older API response from replacing
   * the result of a newer request.
   */
  const requestVersions = useRef<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (!isOpen) return;

    const defaultValues: FormValues = {};

    fields.forEach((field) => {
      defaultValues[field.key] =
        initialValues[field.key] ??
        (field.type === "checkbox" ? false : "");
    });

    setValues(defaultValues);
    setFieldStatuses({});
  }, [isOpen, fields, initialValues]);

  /*
   * Clear debounce timers when component unmounts.
   */
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(
        (timer) => {
          clearTimeout(timer);
        }
      );
    };
  }, []);

  const updateFieldStatus = (
    fieldKey: string,
    status: FieldCheckStatus
  ) => {
    setFieldStatuses((previousStatuses) => ({
      ...previousStatuses,
      [fieldKey]: status,
    }));
  };

  const cancelFieldCheck = (fieldKey: string) => {
    const timer = debounceTimers.current[fieldKey];

    if (timer) {
      clearTimeout(timer);
      delete debounceTimers.current[fieldKey];
    }

    /*
     * Increase the version so that any old response
     * for this field will be ignored.
     */
    requestVersions.current[fieldKey] =
      (requestVersions.current[fieldKey] ?? 0) + 1;
  };

  const debounceCheckExists = (
    field: FieldDef,
    value: string,
    delay: number = 500
  ) => {
    if (!field.checkExistAt?.length) {
      return;
    }

    cancelFieldCheck(field.key);

    updateFieldStatus(field.key, {
      state: "checking",
      message: `Checking ${field.label.toLowerCase()}...`,
    });

    const currentRequestVersion =
      requestVersions.current[field.key];

    debounceTimers.current[field.key] = setTimeout(
      async () => {
        try {
          const result = await checkExists({
            field: field.key,
            value,
            label: field.label,
            at: field.checkExistAt![0].at,
          });

          /*
           * Ignore an old response when the user
           * has already entered a newer value.
           */
          if (
            requestVersions.current[field.key] !==
            currentRequestVersion
          ) {
            return;
          }

          /*
           * Assumes success: true means the value
           * is available.
           */
          if (result?.success) {
            updateFieldStatus(field.key, {
              state: "valid",
              message:
                result.message ||
                `${field.label} is available.`,
            });
          } else {
            updateFieldStatus(field.key, {
              state: "invalid",
              message:
                result?.message ||
                `${field.label} already exists.`,
            });
          }
        } catch (error) {
          if (
            requestVersions.current[field.key] !==
            currentRequestVersion
          ) {
            return;
          }

          updateFieldStatus(field.key, {
            state: "invalid",
            message: `Unable to check ${field.label.toLowerCase()}.`,
          });
        } finally {
          delete debounceTimers.current[field.key];
        }
      },
      delay
    );
  };

  const handleChange = (
    field: FieldDef,
    value: FormValue
  ) => {
    setValues((previousValues) => ({
      ...previousValues,
      [field.key]: value,
    }));

    /*
     * Checkbox values are boolean and should not
     * trigger duplicate checking.
     */
    if (typeof value !== "string") {
      return;
    }

    /*
     * Fields without duplicate-checking configuration
     * do not need to call the API.
     */
    if (!field.checkExistAt?.length) {
      return;
    }

    if (!value.trim()) {
      cancelFieldCheck(field.key);

      updateFieldStatus(field.key, {
        state: "idle",
        message: "",
      });

      return;
    }

    debounceCheckExists(field, value);
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const hasInvalidField = Object.values(
      fieldStatuses
    ).some((status) => status.state === "invalid");

    const hasCheckingField = Object.values(
      fieldStatuses
    ).some((status) => status.state === "checking");

    if (hasInvalidField || hasCheckingField) {
      return;
    }

    onSubmit(values);
  };

  const handleClose = () => {
    Object.values(debounceTimers.current).forEach(
      (timer) => {
        clearTimeout(timer);
      }
    );

    debounceTimers.current = {};
    requestVersions.current = {};

    setFieldStatuses({});
    onClose();
  };

  const hasInvalidField = Object.values(
    fieldStatuses
  ).some((status) => status.state === "invalid");

  const hasCheckingField = Object.values(
    fieldStatuses
  ).some((status) => status.state === "checking");

  const isSubmitDisabled =
    hasInvalidField || hasCheckingField;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <form
        onSubmit={handleSubmit}
        data-testid="form-modal"
        className="flex max-h-[75vh] flex-col"
      >
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldStatus =
                fieldStatuses[field.key] ??
                EMPTY_CHECK_STATUS;

              const inputBorderClass =
                fieldStatus.state === "valid"
                  ? "border-green-500 focus:ring-green-500/30"
                  : fieldStatus.state === "invalid"
                    ? "border-red-500 focus:ring-red-500/30"
                    : "border-border focus:ring-primary/30";

              const stringValue =
                typeof values[field.key] === "string"
                  ? (values[field.key] as string)
                  : "";

              const checkboxValue =
                values[field.key] === true;

              return (
                <div
                  key={field.key}
                  className={
                    field.type === "textarea"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  {/*
                   * Normal label.
                   * Checkbox has its own inline label below.
                   */}
                  {field.type !== "checkbox" && (
                    <label
                      htmlFor={`field-${field.key}`}
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      {field.label}

                      {field.required && (
                        <span className="ml-0.5 text-red-500">
                          *
                        </span>
                      )}
                    </label>
                  )}
                  {field.type === 'checkbox' && (
                    <label
                    htmlFor={`field-${field.key}`}
                    className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      {field.label}
                      {field.required && (
                        <span className="ml-0.5 text-red-500">*</span>
                      )}
                    </label>
                  )}

                  {field.type === "checkbox" ? (
                    <label
                      htmlFor={`field-${field.key}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <input
                        id={`field-${field.key}`}
                        type="checkbox"
                        checked={checkboxValue}
                        onChange={(event) =>
                          handleChange(
                            field,
                            event.target.checked
                          )
                        }
                        required={field.required}
                        className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                        data-testid={`field-${field.key}`}
                      />

                      <span className="text-sm font-medium text-foreground">
                        {field.label}

                        {field.required && (
                          <span className="ml-0.5 text-red-500">
                            *
                          </span>
                        )}
                      </span>
                    </label>
                  ) : field.type === "select" &&
                    field.options ? (
                    <select
  id={`field-${field.key}`}
  value={stringValue}
  onChange={(event) =>
    handleChange(field, event.target.value)
  }
  required={field.required}
  className={`h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 ${inputBorderClass}`}
  data-testid={`field-${field.key}`}
>
  <option value="">Select {field.label}</option>

  {field.options?.map((option) => (
    <option
      key={String(option.value)}
      value={String(option.value)}
    >
      {option.label}
    </option>
  ))}
</select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.key}`}
                      value={stringValue}
                      onChange={(event) =>
                        handleChange(
                          field,
                          event.target.value
                        )
                      }
                      required={field.required}
                      placeholder={
                        field.placeholder ??
                        `Enter ${field.label.toLowerCase()}`
                      }
                      rows={4}
                      className={`block w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${inputBorderClass}`}
                      data-testid={`field-${field.key}`}
                    />
                  ) : (
                    <input
                      id={`field-${field.key}`}
                      type={field.type ?? "text"}
                      value={stringValue}
                      onChange={(event) =>
                        handleChange(
                          field,
                          event.target.value
                        )
                      }
                      required={field.required}
                      placeholder={
                        field.placeholder ??
                        `Enter ${field.label.toLowerCase()}`
                      }
                      className={`h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${inputBorderClass}`}
                      data-testid={`field-${field.key}`}
                    />
                  )}

                  {fieldStatus.state === "checking" && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />

                      <span>{fieldStatus.message}</span>
                    </div>
                  )}

                  {fieldStatus.state === "valid" && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <CircleCheck className="h-3.5 w-3.5" />

                      <span>{fieldStatus.message}</span>
                    </div>
                  )}

                  {fieldStatus.state === "invalid" && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <CircleX className="h-3.5 w-3.5" />

                      <span>{fieldStatus.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border bg-card pt-5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            data-testid="form-cancel"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="form-submit"
          >
            <Save className="h-4 w-4" />

            {hasCheckingField
              ? "Checking..."
              : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}