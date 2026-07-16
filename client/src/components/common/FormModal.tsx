import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFormik } from "formik";
import type { AnyObjectSchema } from "yup";

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

  /**
   * Optional asynchronous availability check.
   */
  checkExistAt?: CheckExistConfig[];

  /**
   * Do not run the asynchronous check until the
   * field contains at least this many characters.
   */
  checkExistMinLength?: number;
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;

  onSubmit: (
    data: Record<string, string>,
  ) => void | Promise<void>;

  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, string>;
  submitLabel?: string;

  /**
   * Each module can provide its own Yup schema.
   */
  validationSchema?: AnyObjectSchema;
}

const EMPTY_INITIAL_VALUES: Record<string, string> = {};

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
  validationSchema,
}: FormModalProps) {
  const [fieldStatuses, setFieldStatuses] = useState<
    Record<string, FieldCheckStatus>
  >({});

  const { checkExists } = useCheck();

  const debounceTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  /**
   * Used to ignore old API responses after
   * the user types a newer value.
   */
  const requestVersions = useRef<
    Record<string, number>
  >({});

  const computedInitialValues = useMemo<
    Record<string, string>
  >(() => {
    return fields.reduce<Record<string, string>>(
      (result, field) => {
        result[field.key] =
          initialValues[field.key] ?? "";

        return result;
      },
      {},
    );
  }, [fields, initialValues]);

  const formik = useFormik<Record<string, string>>({
    initialValues: computedInitialValues,
    validationSchema,
    enableReinitialize: true,

    validateOnChange: true,
    validateOnBlur: true,
    validateOnMount: true,

    onSubmit: async (formValues) => {
      const hasInvalidField =
        Object.values(fieldStatuses).some(
          (status) =>
            status.state === "invalid",
        );

      const hasCheckingField =
        Object.values(fieldStatuses).some(
          (status) =>
            status.state === "checking",
        );

      if (
        hasInvalidField ||
        hasCheckingField
      ) {
        return;
      }

      await onSubmit(formValues);
    },
  });

  const updateFieldStatus = (
    fieldKey: string,
    status: FieldCheckStatus,
  ) => {
    setFieldStatuses(
      (previousStatuses) => ({
        ...previousStatuses,
        [fieldKey]: status,
      }),
    );
  };

  const cancelFieldCheck = (
    fieldKey: string,
  ) => {
    const timer =
      debounceTimers.current[fieldKey];

    if (timer) {
      clearTimeout(timer);

      delete debounceTimers.current[
        fieldKey
      ];
    }

    requestVersions.current[fieldKey] =
      (requestVersions.current[fieldKey] ??
        0) + 1;
  };

  const clearAllChecks = () => {
    Object.values(
      debounceTimers.current,
    ).forEach((timer) => {
      clearTimeout(timer);
    });

    debounceTimers.current = {};

    Object.keys(
      requestVersions.current,
    ).forEach((fieldKey) => {
      requestVersions.current[fieldKey] =
        (requestVersions.current[
          fieldKey
        ] ?? 0) + 1;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    clearAllChecks();

    formik.resetForm({
      values: computedInitialValues,
    });

    setFieldStatuses({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, computedInitialValues]);

  useEffect(() => {
    return () => {
      clearAllChecks();
    };
  }, []);

  const debounceCheckExists = (
    field: FieldDef,
    value: string,
    delay: number = 500,
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

    debounceTimers.current[field.key] =
      setTimeout(async () => {
        try {
          const result =
            await checkExists({
              field: field.key,
              value,
              label: field.label,
              at: field.checkExistAt![0].at,
            });

          /**
           * Ignore old responses when the user
           * has already typed a new value.
           */
          if (
            requestVersions.current[
              field.key
            ] !== currentRequestVersion
          ) {
            return;
          }

          /**
           * Existing useCheck contract:
           * success=true means available.
           */
          if (result?.success) {
            updateFieldStatus(
              field.key,
              {
                state: "valid",
                message:
                  result.message ||
                  `${field.label} is available.`,
              },
            );
          } else {
            updateFieldStatus(
              field.key,
              {
                state: "invalid",
                message:
                  result?.message ||
                  `${field.label} already exists.`,
              },
            );
          }
        } catch {
          if (
            requestVersions.current[
              field.key
            ] !== currentRequestVersion
          ) {
            return;
          }

          updateFieldStatus(field.key, {
            state: "invalid",
            message: `Unable to check ${field.label.toLowerCase()}.`,
          });
        } finally {
          delete debounceTimers.current[
            field.key
          ];
        }
      }, delay);
  };

  const handleChange = async (
    field: FieldDef,
    value: string,
  ) => {
    await formik.setFieldValue(
      field.key,
      value,
      true,
    );

    if (!field.checkExistAt?.length) {
      return;
    }

    cancelFieldCheck(field.key);

    updateFieldStatus(field.key, {
      state: "idle",
      message: "",
    });

    const cleanedValue = value.trim();

    if (!cleanedValue) {
      return;
    }

    const minimumCheckLength =
      field.checkExistMinLength ?? 1;

    /**
     * Example:
     * checkExistMinLength = 6
     *
     * 1–5 characters:
     * Yup error shows, API is not called.
     *
     * 6 characters:
     * Yup passes and debounce starts.
     */
    if (
      cleanedValue.length <
      minimumCheckLength
    ) {
      return;
    }

    /**
     * Do not check an unchanged value
     * while editing.
     */
    const originalValue = String(
      initialValues[field.key] ?? "",
    ).trim();

    if (
      cleanedValue === originalValue
    ) {
      return;
    }

    /**
     * Do not call the API when the field
     * currently fails its Yup validation.
     */
    if (validationSchema) {
      try {
        await validationSchema.validateAt(
          field.key,
          {
            ...formik.values,
            [field.key]: value,
          },
        );
      } catch {
        return;
      }
    }

    debounceCheckExists(
      field,
      cleanedValue,
      500,
    );
  };

  const handleClose = () => {
    clearAllChecks();

    setFieldStatuses({});

    formik.resetForm({
      values: computedInitialValues,
    });

    onClose();
  };

  const hasInvalidField =
    Object.values(fieldStatuses).some(
      (status) =>
        status.state === "invalid",
    );

  const hasCheckingField =
    Object.values(fieldStatuses).some(
      (status) =>
        status.state === "checking",
    );

  const isSubmitDisabled =
    !formik.isValid ||
    formik.isSubmitting ||
    hasInvalidField ||
    hasCheckingField;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        data-testid="form-modal"
        className="flex max-h-[75vh] flex-col"
      >
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldStatus =
                fieldStatuses[field.key] ??
                EMPTY_CHECK_STATUS;

              const fieldValue =
                formik.values[field.key] ??
                "";

              /**
               * Show Yup errors immediately when:
               * - the user has entered any value,
               * - the field has been touched, or
               * - the form has been submitted.
               */
              const shouldShowFormikError =
                Boolean(
                  formik.errors[field.key],
                ) &&
                (
                  Boolean(
                    formik.touched[
                      field.key
                    ],
                  ) ||
                  fieldValue.trim().length >
                    0 ||
                  formik.submitCount > 0
                );

              const formikError =
                shouldShowFormikError
                  ? String(
                      formik.errors[
                        field.key
                      ],
                    )
                  : "";

              const hasFieldError =
                Boolean(formikError) ||
                fieldStatus.state ===
                  "invalid";

              const inputBorderClass =
                fieldStatus.state ===
                  "valid" &&
                !formikError
                  ? "border-green-500 focus:ring-green-500/30"
                  : hasFieldError
                    ? "border-red-500 focus:ring-red-500/30"
                    : "border-border focus:ring-primary/30";

              const commonFieldProps = {
                name: field.key,

                value:
                  formik.values[
                    field.key
                  ] ?? "",

                onBlur:
                  formik.handleBlur,

                "aria-invalid":
                  hasFieldError,

                "data-testid":
                  `field-${field.key}`,
              };

              return (
                <div
                  key={field.key}
                  className={
                    field.type ===
                    "textarea"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {field.label}

                    {field.required && (
                      <span className="ml-0.5 text-red-500">
                        *
                      </span>
                    )}
                  </label>

                  {field.type ===
                    "select" &&
                  field.options ? (
                    <select
                      {...commonFieldProps}
                      onChange={(event) =>
                        void handleChange(
                          field,
                          event.target
                            .value,
                        )
                      }
                      required={
                        field.required
                      }
                      className={`h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 ${inputBorderClass}`}
                    >
                      <option value="">
                        Select{" "}
                        {field.label}
                      </option>

                      {field.options.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {option}
                          </option>
                        ),
                      )}
                    </select>
                  ) : field.type ===
                    "textarea" ? (
                    <textarea
                      {...commonFieldProps}
                      onChange={(event) =>
                        void handleChange(
                          field,
                          event.target
                            .value,
                        )
                      }
                      required={
                        field.required
                      }
                      placeholder={
                        field.placeholder ??
                        `Enter ${field.label.toLowerCase()}`
                      }
                      rows={4}
                      className={`block w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${inputBorderClass}`}
                    />
                  ) : (
                    <input
                      {...commonFieldProps}
                      type={
                        field.type ??
                        "text"
                      }
                      onChange={(event) =>
                        void handleChange(
                          field,
                          event.target
                            .value,
                        )
                      }
                      required={
                        field.required
                      }
                      placeholder={
                        field.placeholder ??
                        `Enter ${field.label.toLowerCase()}`
                      }
                      className={`h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${inputBorderClass}`}
                    />
                  )}

                  {formikError && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <CircleX className="h-3.5 w-3.5" />

                      <span>
                        {formikError}
                      </span>
                    </div>
                  )}

                  {!formikError &&
                    fieldStatus.state ===
                      "checking" && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />

                        <span>
                          {
                            fieldStatus.message
                          }
                        </span>
                      </div>
                    )}

                  {!formikError &&
                    fieldStatus.state ===
                      "valid" && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <CircleCheck className="h-3.5 w-3.5" />

                        <span>
                          {
                            fieldStatus.message
                          }
                        </span>
                      </div>
                    )}

                  {!formikError &&
                    fieldStatus.state ===
                      "invalid" && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                        <CircleX className="h-3.5 w-3.5" />

                        <span>
                          {
                            fieldStatus.message
                          }
                        </span>
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
            disabled={
              formik.isSubmitting
            }
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="form-cancel"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitDisabled
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="form-submit"
          >
            <Save className="h-4 w-4" />

            {formik.isSubmitting
              ? "Saving..."
              : hasCheckingField
                ? "Checking..."
                : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}