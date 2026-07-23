import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as Yup from "yup";

import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/tables/DataTable";

import { Modal } from "@/components/common/Modal";
import { toast } from "sonner";
import useCheck from "@/hooks/useCheck";

import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import useSettings from "@/hooks/useSettngs";

import { useAppSelector } from "../../redux/hooks";

import useTeacher, {
  type AddTeacherPayload,
} from "@/hooks/useTeacher";

import useClass from "@/hooks/useClass";

import type { Teacher } from "../../redux/slicers/teacherSlice";

import { Button } from "@/components/ui/button";
import { StatusTabs, StatusTabOption } from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type TeacherTableRow = Teacher & {
  full_name: string;
  initials: string;
};

type StatusFilter = "all" | "active" | "inactive" | "trash";

const statusTabs: StatusTabOption<StatusFilter>[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "trash",
    label: "Trash",
  },
];

type TeacherFormValues = {
  first_name: string;
  last_name: string;
  employee_code: string;
  email: string;
  phone: string;
  alternate_phone: string;
  gender: string;
  date_of_birth: string;
  blood_group: string;
  marital_status: string;
  current_address: string;
  permanent_address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  qualification: string;
  specialization: string;
  experience_years: string;
  joining_date: string;
  employment_type: string;
  status: string;
  basic_salary: string;
  bank_name: string;
  bank_account_number: string;
  ifsc_code: string;
  pan_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  remarks: string;
};

type TeacherFormErrors = Partial<
  Record<keyof TeacherFormValues, string>
>;

type CheckState =
  | "idle"
  | "checking"
  | "valid"
  | "invalid";

type FieldCheckStatus = {
  state: CheckState;
  message: string;
};

type EmployeeCodeRules =
  | {
      generationType: "auto";
    }
  | {
      generationType: "manual";
      prefix: string;
      digitLength: number;
    };

type SettingRecord = {
  key: string;
  value?: string | number | boolean | null;
};

const EMPTY_CHECK_STATUS: FieldCheckStatus = {
  state: "idle",
  message: "",
};


const EMPLOYEE_CODE_CHECK_AT = "teacher";


const columns: Column[] = [
  {
    key: "employee_code",
    label: "Employee Code",
  },
  {
    key: "full_name",
    label: "Teacher",
    type: "avatar-text",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "phone",
    label: "Phone",
  },
  {
    key: "status",
    label: "Status",
    type: "badge",
  },
];

const genderOptions = ["male", "female", "other"];

const bloodGroupOptions = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const maritalStatusOptions = [
  "single",
  "married",
  "divorced",
  "widowed",
];

const employmentTypeOptions = [
  "full_time",
  "part_time",
  "contract",
];

const statusOptions = [
  "active",
  "inactive",
  "resigned",
];

function normalizeSettings(
  response: unknown,
): SettingRecord[] {
  if (Array.isArray(response)) {
    return response as SettingRecord[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    const responseData = (
      response as {
        data?: unknown;
      }
    ).data;

    if (Array.isArray(responseData)) {
      return responseData as SettingRecord[];
    }

    if (
      responseData &&
      typeof responseData === "object" &&
      "data" in responseData
    ) {
      const nestedData = (
        responseData as {
          data?: unknown;
        }
      ).data;

      if (Array.isArray(nestedData)) {
        return nestedData as SettingRecord[];
      }
    }
  }

  return [];
}

const emptyTeacherFormValues: TeacherFormValues = {
  first_name: "",
  last_name: "",
  employee_code: "",
  email: "",
  phone: "",
  alternate_phone: "",
  gender: "",
  date_of_birth: "",
  blood_group: "",
  marital_status: "",
  current_address: "",
  permanent_address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  qualification: "",
  specialization: "",
  experience_years: "",
  joining_date: "",
  employment_type: "",
  status: "active",
  basic_salary: "",
  bank_name: "",
  bank_account_number: "",
  ifsc_code: "",
  pan_number: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
  remarks: "",
};

const createTeacherValidationSchema = (
  employeeCodeRules: EmployeeCodeRules,
) => {
  const employeeCodeSchema =
    employeeCodeRules.generationType === "manual"
      ? Yup.string()
          .trim()
          .required("Employee code is required")
          .matches(
            /^\d+$/,
            "Employee code must contain numbers only",
          )
          .length(
            employeeCodeRules.digitLength,
            `Employee code must contain exactly ${employeeCodeRules.digitLength} digits`,
          )
      : Yup.string()
          .trim()
          .optional();

  return Yup.object({
    first_name: Yup.string()
      .trim()
      .max(
        100,
        "First name cannot exceed 100 characters",
      )
      .required("First name is required"),

    last_name: Yup.string()
      .trim()
      .max(
        100,
        "Last name cannot exceed 100 characters",
      )
      .required("Last name is required"),

    employee_code: employeeCodeSchema,

    email: Yup.string()
      .trim()
      .email("Enter a valid email address")
      .max(
        255,
        "Email cannot exceed 255 characters",
      )
      .required("Email is required"),

    phone: Yup.string()
      .trim()
      .required("Phone number is required")
      .matches(/^\d{10}$/, {
        message:
          "Phone number must contain exactly 10 digits",
        excludeEmptyString: true,
      }),

    alternate_phone: Yup.string()
      .trim()
      .matches(/^\d{10}$/, {
        message:
          "Alternate phone must contain exactly 10 digits",
        excludeEmptyString: true,
      })
      .optional(),

    gender: Yup.string()
      .oneOf(
        [
          "male",
          "female",
          "other",
          "",
        ],
        "Select a valid gender",
      )
      .optional(),

    date_of_birth: Yup.date()
      .transform(
        (
          value,
          originalValue,
        ) =>
          originalValue === ""
            ? undefined
            : value,
      )
      .typeError(
        "Enter a valid date of birth",
      )
      .max(
        new Date(),
        "Date of birth cannot be in the future",
      )
      .optional(),

    blood_group: Yup.string()
      .oneOf(
        [
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
          "",
        ],
        "Select a valid blood group",
      )
      .optional(),

    marital_status: Yup.string()
      .oneOf(
        [
          "single",
          "married",
          "divorced",
          "widowed",
          "",
        ],
        "Select a valid marital status",
      )
      .optional(),

    current_address: Yup.string()
      .trim()
      .max(
        1000,
        "Current address cannot exceed 1000 characters",
      )
      .optional(),

    permanent_address: Yup.string()
      .trim()
      .max(
        1000,
        "Permanent address cannot exceed 1000 characters",
      )
      .optional(),

    city: Yup.string()
      .trim()
      .max(
        100,
        "City cannot exceed 100 characters",
      )
      .optional(),

    state: Yup.string()
      .trim()
      .max(
        100,
        "State cannot exceed 100 characters",
      )
      .optional(),

    country: Yup.string()
      .trim()
      .max(
        100,
        "Country cannot exceed 100 characters",
      )
      .optional(),

    pincode: Yup.string()
      .trim()
      .matches(/^\d{6}$/, {
        message:
          "Pincode must contain exactly 6 digits",
        excludeEmptyString: true,
      })
      .optional(),

    qualification: Yup.string()
      .trim()
      .max(
        255,
        "Qualification cannot exceed 255 characters",
      )
      .optional(),

    specialization: Yup.string()
      .trim()
      .max(
        255,
        "Specialization cannot exceed 255 characters",
      )
      .optional(),

    experience_years: Yup.number()
      .transform(
        (
          value,
          originalValue,
        ) =>
          originalValue === ""
            ? undefined
            : value,
      )
      .typeError(
        "Experience years must be a valid number",
      )
      .integer(
        "Experience years must be a whole number",
      )
      .min(
        0,
        "Experience years cannot be negative",
      )
      .max(
        80,
        "Experience years cannot exceed 80",
      )
      .optional(),

    joining_date: Yup.date()
      .transform(
        (
          value,
          originalValue,
        ) =>
          originalValue === ""
            ? undefined
            : value,
      )
      .typeError(
        "Enter a valid joining date",
      )
      .optional(),

    employment_type: Yup.string()
      .oneOf(
        [
          "full_time",
          "part_time",
          "contract",
          "",
        ],
        "Select a valid employment type",
      )
      .optional(),

    status: Yup.string()
      .oneOf(
        [
          "active",
          "inactive",
          "resigned",
          "",
        ],
        "Select a valid status",
      )
      .optional(),

    basic_salary: Yup.number()
      .transform(
        (
          value,
          originalValue,
        ) =>
          originalValue === ""
            ? undefined
            : value,
      )
      .typeError(
        "Basic salary must be a valid number",
      )
      .min(
        0,
        "Basic salary cannot be negative",
      )
      .optional(),

    bank_name: Yup.string()
      .trim()
      .max(
        150,
        "Bank name cannot exceed 150 characters",
      )
      .optional(),

    bank_account_number: Yup.string()
      .trim()
      .matches(/^\d{6,20}$/, {
        message:
          "Bank account number must contain 6 to 20 digits",
        excludeEmptyString: true,
      })
      .optional(),

    ifsc_code: Yup.string()
      .trim()
      .matches(
        /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
        {
          message:
            "Enter a valid IFSC code",
          excludeEmptyString: true,
        },
      )
      .optional(),

    pan_number: Yup.string()
      .trim()
      .matches(
        /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/,
        {
          message:
            "Enter a valid PAN number",
          excludeEmptyString: true,
        },
      )
      .optional(),

    emergency_contact_name: Yup.string()
      .trim()
      .max(
        150,
        "Emergency contact name cannot exceed 150 characters",
      )
      .optional(),

    emergency_contact_phone: Yup.string()
      .trim()
      .matches(/^\d{10}$/, {
        message:
          "Emergency contact phone must contain exactly 10 digits",
        excludeEmptyString: true,
      })
      .optional(),

    emergency_contact_relation: Yup.string()
      .trim()
      .max(
        50,
        "Emergency contact relation cannot exceed 50 characters",
      )
      .optional(),

    remarks: Yup.string()
      .trim()
      .max(
        2000,
        "Remarks cannot exceed 2000 characters",
      )
      .optional(),
  });
};

function getFullName(teacher: Teacher): string {
  return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();
}

function makeInitials(
  firstName?: string,
  lastName?: string,
): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase();
}

function safeValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value);
}

function teacherToInitialValues(
  teacher: Teacher,
): TeacherFormValues {
  return {
    first_name: safeValue(teacher.first_name),
    last_name: safeValue(teacher.last_name),
    employee_code: safeValue(teacher.employee_code),
    email: safeValue(teacher.email),
    phone: safeValue(teacher.phone),
    alternate_phone: safeValue(teacher.alternate_phone),
    gender: safeValue(teacher.gender),
    date_of_birth: safeValue(teacher.date_of_birth),
    blood_group: safeValue(teacher.blood_group),
    marital_status: safeValue(teacher.marital_status),
    current_address: safeValue(teacher.current_address),
    permanent_address: safeValue(teacher.permanent_address),
    city: safeValue(teacher.city),
    state: safeValue(teacher.state),
    country: safeValue(teacher.country),
    pincode: safeValue(teacher.pincode),
    qualification: safeValue(teacher.qualification),
    specialization: safeValue(teacher.specialization),
    experience_years: safeValue(teacher.experience_years),
    joining_date: safeValue(teacher.joining_date),
    employment_type: safeValue(teacher.employment_type),
    status: safeValue(teacher.status) || "active",
    basic_salary: safeValue(teacher.basic_salary),
    bank_name: safeValue(teacher.bank_name),
    bank_account_number: safeValue(teacher.bank_account_number),
    ifsc_code: safeValue(teacher.ifsc_code),
    pan_number: safeValue(teacher.pan_number),
    emergency_contact_name: safeValue(teacher.emergency_contact_name),
    emergency_contact_phone: safeValue(teacher.emergency_contact_phone),
    emergency_contact_relation: safeValue(
      teacher.emergency_contact_relation,
    ),
    remarks: safeValue(teacher.remarks),
  };
}

function buildTeacherPayload(
  values: TeacherFormValues,
): AddTeacherPayload {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name?.trim() || undefined,
    employee_code: values.employee_code?.trim() || undefined,
    email: values.email?.trim().toLowerCase() || undefined,
    phone: values.phone?.trim() || undefined,
    alternate_phone: values.alternate_phone?.trim() || undefined,
    gender: values.gender || undefined,
    date_of_birth: values.date_of_birth || undefined,
    blood_group: values.blood_group || undefined,
    marital_status: values.marital_status || undefined,
    current_address: values.current_address?.trim() || undefined,
    permanent_address: values.permanent_address?.trim() || undefined,
    city: values.city?.trim() || undefined,
    state: values.state?.trim() || undefined,
    country: values.country?.trim() || undefined,
    pincode: values.pincode?.trim() || undefined,
    qualification: values.qualification?.trim() || undefined,
    specialization: values.specialization?.trim() || undefined,
    experience_years: values.experience_years
      ? Number(values.experience_years)
      : 0,
    joining_date: values.joining_date || undefined,
    employment_type: values.employment_type || undefined,
    status: values.status || "active",
    basic_salary: values.basic_salary
      ? Number(values.basic_salary)
      : undefined,
    bank_name: values.bank_name?.trim() || undefined,
    bank_account_number:
      values.bank_account_number?.trim() || undefined,
    ifsc_code: values.ifsc_code?.trim().toUpperCase() || undefined,
    pan_number: values.pan_number?.trim().toUpperCase() || undefined,
    emergency_contact_name:
      values.emergency_contact_name?.trim() || undefined,
    emergency_contact_phone:
      values.emergency_contact_phone?.trim() || undefined,
    emergency_contact_relation:
      values.emergency_contact_relation?.trim() || undefined,
    remarks: values.remarks?.trim() || undefined,
  };
}


function prepareTeacherFormValues(
  initialValues: TeacherFormValues | undefined,
  employeeCodeRules: EmployeeCodeRules,
): TeacherFormValues {
  const nextValues: TeacherFormValues = {
    ...emptyTeacherFormValues,
    ...(initialValues ?? {}),
  };

  if (
    employeeCodeRules.generationType === "auto"
  ) {
    nextValues.employee_code = "";
    return nextValues;
  }

  const storedCode =
    nextValues.employee_code
      .trim()
      .toUpperCase();

  if (!storedCode) {
    nextValues.employee_code = "";
    return nextValues;
  }

  if (
    storedCode.startsWith(
      employeeCodeRules.prefix,
    )
  ) {
    nextValues.employee_code =
      storedCode.slice(
        employeeCodeRules.prefix.length,
      );

    return nextValues;
  }

  const trailingDigits =
    storedCode.match(
      new RegExp(
        `(\\d{${employeeCodeRules.digitLength}})$`,
      ),
    )?.[1];

  nextValues.employee_code =
    trailingDigits ?? storedCode;

  return nextValues;
}


function FieldWrapper({
  label,
  required,
  error,
  full = false,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive">*</span>
        )}
      </label>

      {children}

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const textareaClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";


function TeacherFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialValues,
  submitLabel,
  employeeCodeRules,
  settingsLoading,
  settingsError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    values: TeacherFormValues,
  ) => Promise<void> | void;
  title: string;
  initialValues?: TeacherFormValues;
  submitLabel: string;
  employeeCodeRules: EmployeeCodeRules;
  settingsLoading: boolean;
  settingsError: string;
}) {
  const { checkExists } = useCheck();

  const teacherValidationSchema =
    useMemo(
      () =>
        createTeacherValidationSchema(
          employeeCodeRules,
        ),
      [employeeCodeRules],
    );

  const resolvedInitialValues =
    useMemo(
      () =>
        prepareTeacherFormValues(
          initialValues,
          employeeCodeRules,
        ),
      [
        initialValues,
        employeeCodeRules,
      ],
    );

  const [values, setValues] =
    useState<TeacherFormValues>(
      resolvedInitialValues,
    );

  const [errors, setErrors] =
    useState<TeacherFormErrors>({});

  const [submitting, setSubmitting] =
    useState(false);

  const [touched, setTouched] =
    useState<
      Partial<
        Record<
          keyof TeacherFormValues,
          boolean
        >
      >
    >({});

  const [submitCount, setSubmitCount] =
    useState(0);

  const [
    employeeCodeStatus,
    setEmployeeCodeStatus,
  ] = useState<FieldCheckStatus>(
    EMPTY_CHECK_STATUS,
  );

  const debounceTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);


  const requestVersion = useRef(0);

  const cancelEmployeeCodeCheck = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    requestVersion.current += 1;
  };

  useEffect(() => {
    if (isOpen) {
      setValues(
        resolvedInitialValues,
      );

      setErrors({});
      setTouched({});
      setSubmitCount(0);
      setSubmitting(false);

      setEmployeeCodeStatus(
        EMPTY_CHECK_STATUS,
      );

      cancelEmployeeCodeCheck();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    resolvedInitialValues,
  ]);

  useEffect(() => {
    return () => {
      cancelEmployeeCodeCheck();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateField = async (
    key: keyof TeacherFormValues,
    nextValues: TeacherFormValues,
  ) => {
    try {
      await teacherValidationSchema.validateAt(
        key,
        nextValues,
      );

      setErrors((prev) => ({ ...prev, [key]: undefined }));
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        setErrors((prev) => ({
          ...prev,
          [key]: err.message,
        }));
      }
    }
  };

  const setField = (
    key: keyof TeacherFormValues,
    value: string,
  ) => {
    const nextValues = { ...values, [key]: value };

    setValues(nextValues);

    void validateField(key, nextValues);
  };

  const markTouched = (
    key: keyof TeacherFormValues,
  ) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    void validateField(key, values);
  };

  const getDisplayError = (
    key: keyof TeacherFormValues,
  ): string | undefined => {
    const message = errors[key];

    if (!message) {
      return undefined;
    }

    const hasValue =
      (values[key] ?? "").trim().length > 0;

    if (touched[key] || hasValue || submitCount > 0) {
      return message;
    }

    return undefined;
  };

  const debounceCheckEmployeeCode = (
    numericCode: string,
    delay = 500,
  ) => {
    cancelEmployeeCodeCheck();

    setEmployeeCodeStatus({
      state: "checking",
      message: "Checking employee code availability...",
    });

    const currentRequestVersion =
      requestVersion.current;

    debounceTimer.current = setTimeout(async () => {
      try {
        if (
          employeeCodeRules.generationType !==
          "manual"
        ) {
          return;
        }

        const fullEmployeeCode =
          `${employeeCodeRules.prefix}${numericCode}`;

        const result =
          await checkExists({
            field:
              "employee_code",
            value:
              fullEmployeeCode,
            label:
              "Employee Code",
            at:
              EMPLOYEE_CODE_CHECK_AT,
          });

        // Ignore stale responses.
        if (
          requestVersion.current !==
          currentRequestVersion
        ) {
          return;
        }

        if (result?.success) {
          setEmployeeCodeStatus({
            state: "valid",
            message:
              result.message ||
              "Employee code is available.",
          });
        } else {
          setEmployeeCodeStatus({
            state: "invalid",
            message:
              result?.message ||
              "Employee code already exists.",
          });
        }
      } catch {
        if (
          requestVersion.current !==
          currentRequestVersion
        ) {
          return;
        }

        setEmployeeCodeStatus({
          state: "invalid",
          message: "Unable to check employee code.",
        });
      } finally {
        debounceTimer.current = null;
      }
    }, delay);
  };

  const handleEmployeeCodeChange = async (
    value: string,
  ) => {
    setField("employee_code", value);

    cancelEmployeeCodeCheck();

    setEmployeeCodeStatus(
      EMPTY_CHECK_STATUS,
    );

    if (
      employeeCodeRules.generationType !==
      "manual"
    ) {
      return;
    }

    const cleanedValue =
      value.trim();

    if (!cleanedValue) {
      return;
    }

  
    if (
      cleanedValue.length !==
        employeeCodeRules.digitLength ||
      !/^\d+$/.test(cleanedValue)
    ) {
      return;
    }

    const originalValue =
      resolvedInitialValues.employee_code.trim();

    if (
      cleanedValue === originalValue
    ) {
      return;
    }

    try {
      await teacherValidationSchema.validateAt(
        "employee_code",
        {
          ...values,
          employee_code: value,
        },
      );
    } catch {
      return;
    }

    debounceCheckEmployeeCode(
      cleanedValue,
    );
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setSubmitCount((prev) => prev + 1);

    setTouched(() => {
      const allTouched: Partial<
        Record<keyof TeacherFormValues, boolean>
      > = {};

      (Object.keys(values) as Array<
        keyof TeacherFormValues
      >).forEach((key) => {
        allTouched[key] = true;
      });

      return allTouched;
    });

    if (settingsLoading) {
      toast.error(
        "Please wait for the employee code settings to load.",
      );
      return;
    }

    if (settingsError) {
      toast.error(settingsError);
      return;
    }

    if (employeeCodeStatus.state === "checking") {
      toast.error(
        "Please wait for the employee code check to finish.",
      );
      return;
    }

    if (employeeCodeStatus.state === "invalid") {
      toast.error(
        employeeCodeStatus.message ||
          "Employee code already exists.",
      );
      return;
    }

    try {
      await teacherValidationSchema.validate(values, {
        abortEarly: false,
      });

      setErrors({});
      setSubmitting(true);

      const submissionValues: TeacherFormValues =
        employeeCodeRules.generationType ===
        "auto"
          ? {
              ...values,
              employee_code: "",
            }
          : values;

      await onSubmit(
        submissionValues,
      );
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const nextErrors: TeacherFormErrors = {};

        err.inner.forEach((validationError) => {
          if (
            validationError.path &&
            !nextErrors[
              validationError.path as keyof TeacherFormValues
            ]
          ) {
            nextErrors[
              validationError.path as keyof TeacherFormValues
            ] = validationError.message;
          }
        });

        setErrors(nextErrors);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        {settingsLoading && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading employee code settings...
          </div>
        )}

        {settingsError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {settingsError}
          </div>
        )}

        {employeeCodeRules.generationType ===
          "auto" &&
          !settingsLoading &&
          !settingsError && (
            <div className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Employee code will be generated automatically.
            </div>
          )}

        <div className="max-h-[65vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* Basic Information */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Basic Information
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="First Name"
                  required
                  error={getDisplayError("first_name")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Alan"
                    value={values.first_name}
                    onChange={(e) =>
                      setField("first_name", e.target.value)
                    }
                  onBlur={() => markTouched("first_name")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Last Name"
                  required
                  error={getDisplayError("last_name")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Turing"
                    value={values.last_name}
                    onChange={(e) =>
                      setField("last_name", e.target.value)
                    }
                  onBlur={() => markTouched("last_name")}
                  />
                </FieldWrapper>

                {employeeCodeRules.generationType ===
                  "manual" && (
                  <FieldWrapper
                    label="Employee Code"
                    required
                    error={getDisplayError(
                      "employee_code",
                    )}
                  >
                    <div className="flex">
                      <span className="inline-flex h-9 items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
                        {
                          employeeCodeRules.prefix
                        }
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={
                          employeeCodeRules.digitLength
                        }
                        className={`${inputClass} rounded-l-none ${
                          getDisplayError(
                            "employee_code",
                          )
                            ? "border-red-500 focus:ring-red-500/30"
                            : employeeCodeStatus.state ===
                                "valid"
                              ? "border-green-500 focus:ring-green-500/30"
                              : employeeCodeStatus.state ===
                                  "invalid"
                                ? "border-red-500 focus:ring-red-500/30"
                                : ""
                        }`}
                        placeholder={`Enter ${employeeCodeRules.digitLength} digits`}
                        value={
                          values.employee_code
                        }
                        onChange={(event) =>
                          void handleEmployeeCodeChange(
                            event.target.value,
                          )
                        }
                        onBlur={() =>
                          markTouched(
                            "employee_code",
                          )
                        }
                      />
                    </div>

                    {!getDisplayError(
                      "employee_code",
                    ) &&
                      employeeCodeStatus.state ===
                        "checking" && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />

                          <span>
                            {
                              employeeCodeStatus.message
                            }
                          </span>
                        </div>
                      )}

                    {!getDisplayError(
                      "employee_code",
                    ) &&
                      employeeCodeStatus.state ===
                        "valid" && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600">
                          <CircleCheck className="h-3.5 w-3.5" />

                          <span>
                            {
                              employeeCodeStatus.message
                            }
                          </span>
                        </div>
                      )}

                    {!getDisplayError(
                      "employee_code",
                    ) &&
                      employeeCodeStatus.state ===
                        "invalid" && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <CircleX className="h-3.5 w-3.5" />

                          <span>
                            {
                              employeeCodeStatus.message
                            }
                          </span>
                        </div>
                      )}
                  </FieldWrapper>
                )}

                <FieldWrapper
                  label="Email"
                  required
                  error={getDisplayError("email")}
                >
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="teacher@school.edu"
                    value={values.email}
                    onChange={(e) =>
                      setField("email", e.target.value)
                    }
                  onBlur={() => markTouched("email")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Phone"
                  required
                  error={getDisplayError("phone")}
                >
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="9876543210"
                    value={values.phone}
                    onChange={(e) =>
                      setField("phone", e.target.value)
                    }
                  onBlur={() => markTouched("phone")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Alternate Phone"
                  error={getDisplayError("alternate_phone")}
                >
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="9876543210"
                    value={values.alternate_phone}
                    onChange={(e) =>
                      setField("alternate_phone", e.target.value)
                    }
                  onBlur={() => markTouched("alternate_phone")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Status"
                  error={getDisplayError("status")}
                >
                  <select
                    className={inputClass}
                    value={values.status}
                    onChange={(e) =>
                      setField("status", e.target.value)
                    }
                  onBlur={() => markTouched("status")}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>
              </div>
            </section>

            {/* Personal Details */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Personal Details
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Gender"
                  error={getDisplayError("gender")}
                >
                  <select
                    className={inputClass}
                    value={values.gender}
                    onChange={(e) =>
                      setField("gender", e.target.value)
                    }
                  onBlur={() => markTouched("gender")}
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>

                <FieldWrapper
                  label="Date of Birth"
                  error={getDisplayError("date_of_birth")}
                >
                  <input
                    type="date"
                    className={inputClass}
                    value={values.date_of_birth}
                    onChange={(e) =>
                      setField("date_of_birth", e.target.value)
                    }
                  onBlur={() => markTouched("date_of_birth")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Blood Group"
                  error={getDisplayError("blood_group")}
                >
                  <select
                    className={inputClass}
                    value={values.blood_group}
                    onChange={(e) =>
                      setField("blood_group", e.target.value)
                    }
                  onBlur={() => markTouched("blood_group")}
                  >
                    <option value="">Select blood group</option>
                    {bloodGroupOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>

                <FieldWrapper
                  label="Marital Status"
                  error={getDisplayError("marital_status")}
                >
                  <select
                    className={inputClass}
                    value={values.marital_status}
                    onChange={(e) =>
                      setField("marital_status", e.target.value)
                    }
                  onBlur={() => markTouched("marital_status")}
                  >
                    <option value="">Select marital status</option>
                    {maritalStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>
              </div>
            </section>

            {/* Address Details */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Address Details
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Current Address"
                  error={getDisplayError("current_address")}
                  full
                >
                  <textarea
                    className={textareaClass}
                    rows={2}
                    placeholder="Enter current address"
                    value={values.current_address}
                    onChange={(e) =>
                      setField("current_address", e.target.value)
                    }
                  onBlur={() => markTouched("current_address")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Permanent Address"
                  error={getDisplayError("permanent_address")}
                  full
                >
                  <textarea
                    className={textareaClass}
                    rows={2}
                    placeholder="Enter permanent address"
                    value={values.permanent_address}
                    onChange={(e) =>
                      setField("permanent_address", e.target.value)
                    }
                  onBlur={() => markTouched("permanent_address")}
                  />
                </FieldWrapper>

                <FieldWrapper label="City" error={getDisplayError("city")}>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Kolkata"
                    value={values.city}
                    onChange={(e) =>
                      setField("city", e.target.value)
                    }
                  onBlur={() => markTouched("city")}
                  />
                </FieldWrapper>

                <FieldWrapper label="State" error={getDisplayError("state")}>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. West Bengal"
                    value={values.state}
                    onChange={(e) =>
                      setField("state", e.target.value)
                    }
                  onBlur={() => markTouched("state")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Country"
                  error={getDisplayError("country")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. India"
                    value={values.country}
                    onChange={(e) =>
                      setField("country", e.target.value)
                    }
                  onBlur={() => markTouched("country")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Pincode"
                  error={getDisplayError("pincode")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 700001"
                    value={values.pincode}
                    onChange={(e) =>
                      setField("pincode", e.target.value)
                    }
                  onBlur={() => markTouched("pincode")}
                  />
                </FieldWrapper>
              </div>
            </section>

            {/* Professional Details */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Professional Details
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Qualification"
                  error={getDisplayError("qualification")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. M.Sc, B.Ed"
                    value={values.qualification}
                    onChange={(e) =>
                      setField("qualification", e.target.value)
                    }
                  onBlur={() => markTouched("qualification")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Specialization"
                  error={getDisplayError("specialization")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Mathematics"
                    value={values.specialization}
                    onChange={(e) =>
                      setField("specialization", e.target.value)
                    }
                  onBlur={() => markTouched("specialization")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Experience Years"
                  error={getDisplayError("experience_years")}
                >
                  <input
                    type="number"
                    className={inputClass}
                    placeholder="e.g. 5"
                    value={values.experience_years}
                    onChange={(e) =>
                      setField(
                        "experience_years",
                        e.target.value,
                      )
                    }
                  onBlur={() => markTouched("experience_years")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Joining Date"
                  error={getDisplayError("joining_date")}
                >
                  <input
                    type="date"
                    className={inputClass}
                    value={values.joining_date}
                    onChange={(e) =>
                      setField("joining_date", e.target.value)
                    }
                  onBlur={() => markTouched("joining_date")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Employment Type"
                  error={getDisplayError("employment_type")}
                >
                  <select
                    className={inputClass}
                    value={values.employment_type}
                    onChange={(e) =>
                      setField("employment_type", e.target.value)
                    }
                  onBlur={() => markTouched("employment_type")}
                  >
                    <option value="">Select employment type</option>
                    {employmentTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>
              </div>
            </section>

            {/* Salary / Bank Details */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Salary / Bank Details
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Basic Salary"
                  error={getDisplayError("basic_salary")}
                >
                  <input
                    type="number"
                    className={inputClass}
                    placeholder="e.g. 25000"
                    value={values.basic_salary}
                    onChange={(e) =>
                      setField("basic_salary", e.target.value)
                    }
                  onBlur={() => markTouched("basic_salary")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Bank Name"
                  error={getDisplayError("bank_name")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. HDFC Bank"
                    value={values.bank_name}
                    onChange={(e) =>
                      setField("bank_name", e.target.value)
                    }
                  onBlur={() => markTouched("bank_name")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Bank Account Number"
                  error={getDisplayError("bank_account_number")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Enter account number"
                    value={values.bank_account_number}
                    onChange={(e) =>
                      setField(
                        "bank_account_number",
                        e.target.value,
                      )
                    }
                  onBlur={() => markTouched("bank_account_number")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="IFSC Code"
                  error={getDisplayError("ifsc_code")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. HDFC0001234"
                    value={values.ifsc_code}
                    onChange={(e) =>
                      setField("ifsc_code", e.target.value)
                    }
                  onBlur={() => markTouched("ifsc_code")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="PAN Number"
                  error={getDisplayError("pan_number")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. ABCDE1234F"
                    value={values.pan_number}
                    onChange={(e) =>
                      setField("pan_number", e.target.value)
                    }
                  onBlur={() => markTouched("pan_number")}
                  />
                </FieldWrapper>
              </div>
            </section>

            {/* Emergency Contact */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Emergency Contact
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Emergency Contact Name"
                  error={getDisplayError("emergency_contact_name")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. John Doe"
                    value={values.emergency_contact_name}
                    onChange={(e) =>
                      setField(
                        "emergency_contact_name",
                        e.target.value,
                      )
                    }
                  onBlur={() => markTouched("emergency_contact_name")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Emergency Contact Phone"
                  error={getDisplayError("emergency_contact_phone")}
                >
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="9876543210"
                    value={values.emergency_contact_phone}
                    onChange={(e) =>
                      setField(
                        "emergency_contact_phone",
                        e.target.value,
                      )
                    }
                  onBlur={() => markTouched("emergency_contact_phone")}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Emergency Contact Relation"
                  error={getDisplayError("emergency_contact_relation")}
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Father"
                    value={values.emergency_contact_relation}
                    onChange={(e) =>
                      setField(
                        "emergency_contact_relation",
                        e.target.value,
                      )
                    }
                  onBlur={() => markTouched("emergency_contact_relation")}
                  />
                </FieldWrapper>
              </div>
            </section>

            {/* Remarks */}
            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Remarks
              </h4>

              <FieldWrapper
                label="Remarks"
                error={getDisplayError("remarks")}
                full
              >
                <textarea
                  className={textareaClass}
                  rows={3}
                  placeholder="Enter remarks"
                  value={values.remarks}
                  onChange={(e) =>
                    setField("remarks", e.target.value)
                  }
                  onBlur={() => markTouched("remarks")}
                />
              </FieldWrapper>
            </section>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              submitting ||
              settingsLoading ||
              Boolean(settingsError) ||
              employeeCodeStatus.state ===
                "checking" ||
              employeeCodeStatus.state ===
                "invalid"
            }
          >
            {submitting
              ? "Saving..."
              : employeeCodeStatus.state === "checking"
                ? "Checking..."
                : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Teachers page                                                       */
/* ------------------------------------------------------------------ */

export default function Teachers() {
  const teachers = useAppSelector(
    (state) => state.teacher.teachers,
  );

  const { classes } = useAppSelector((state) => state.class);
  const [isLoading, setIsLoading] = useState(true);

  const {
    getTeachers,
    addteacher,
    updateteacher,
    deleteteacher,
    restoreteacher,
    permanentdeleteteacher,
  } = useTeacher();

  const { getClasses } = useClass();
  const { getSettingsbyKey } = useSettings();

  const getSettingsByKeyRef =
    useRef(getSettingsbyKey);

  useEffect(() => {
    getSettingsByKeyRef.current =
      getSettingsbyKey;
  }, [getSettingsbyKey]);

  const [
    employeeCodeRules,
    setEmployeeCodeRules,
  ] = useState<EmployeeCodeRules>({
    generationType: "auto",
  });

  const [
    employeeCodeSettingsLoading,
    setEmployeeCodeSettingsLoading,
  ] = useState(false);

  const [
    employeeCodeSettingsError,
    setEmployeeCodeSettingsError,
  ] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState<Teacher | null>(null);
  const [editItem, setEditItem] = useState<Teacher | null>(null);
  const [deleteItem, setDeleteItem] = useState<Teacher | null>(null);
  const [restoreItem, setRestoreItem] = useState<Teacher | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<Teacher | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedClassId, setSelectedClassId] =
    useState<string>("all");

  const itemsPerPage = 10;

  const loadTeachers = async (status: StatusFilter) => {
    try {
      setIsLoading(true);
      await getTeachers(status);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeachers(statusFilter);
    void getClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherFormOpen =
    addOpen || Boolean(editItem);

  useEffect(() => {
    if (!teacherFormOpen) {
      return;
    }

    let active = true;

    const loadEmployeeCodeSettings =
      async () => {
        setEmployeeCodeSettingsLoading(
          true,
        );

        setEmployeeCodeSettingsError(
          "",
        );

        try {
          const response =
            await getSettingsByKeyRef.current(
              "users",
            );

          if (!active) {
            return;
          }

          const settings =
            normalizeSettings(response);

          const generationSetting =
            settings.find(
              (setting) =>
                setting.key ===
                "employee_code_generated_by",
            );

          const generationType =
            String(
              generationSetting?.value ??
                "",
            )
              .trim()
              .toLowerCase();

          if (
            generationType === "auto"
          ) {
            setEmployeeCodeRules({
              generationType: "auto",
            });

            return;
          }

          if (
            generationType !== "manual"
          ) {
            throw new Error(
              "employee_code_generated_by must be auto or manual",
            );
          }

          /*
           * Prefix and length are required only
           * when manual generation is enabled.
           */
          const prefixSetting =
            settings.find(
              (setting) =>
                setting.key ===
                "employee_code_prefix",
            );

          const lengthSetting =
            settings.find(
              (setting) =>
                setting.key ===
                "employee_code_length",
            );

          const prefix = String(
            prefixSetting?.value ?? "",
          )
            .trim()
            .toUpperCase();

          if (!prefix) {
            throw new Error(
              "Employee code prefix is not configured",
            );
          }

          const digitLength =
            Number(
              lengthSetting?.value,
            );

          if (
            !Number.isInteger(
              digitLength,
            ) ||
            digitLength <= 0
          ) {
            throw new Error(
              "Employee code length must be a positive integer",
            );
          }

          setEmployeeCodeRules({
            generationType:
              "manual",
            prefix,
            digitLength,
          });
        } catch (error) {
          if (!active) {
            return;
          }

          setEmployeeCodeSettingsError(
            error instanceof Error
              ? error.message
              : "Unable to load employee code settings",
          );
        } finally {
          if (active) {
            setEmployeeCodeSettingsLoading(
              false,
            );
          }
        }
      };

    void loadEmployeeCodeSettings();

    return () => {
      active = false;
    };
  }, [teacherFormOpen]);

  const editInitialValues = useMemo(() => {
    return editItem ? teacherToInitialValues(editItem) : undefined;
  }, [editItem]);

  const tableData: TeacherTableRow[] = useMemo(() => {
    return teachers.map((teacher) => ({
      ...teacher,
      full_name: getFullName(teacher),
      initials: makeInitials(
        teacher.first_name,
        teacher.last_name,
      ),
    }));
  }, [teachers]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return tableData;
    }

    return tableData.filter(
      (teacher) =>
        teacher.employee_code?.toLowerCase().includes(keyword) ||
        teacher.full_name.toLowerCase().includes(keyword) ||
        teacher.email?.toLowerCase().includes(keyword) ||
        teacher.phone?.toLowerCase().includes(keyword) ||
        teacher.qualification?.toLowerCase().includes(keyword) ||
        teacher.specialization?.toLowerCase().includes(keyword),
    );
  }, [search, tableData]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / itemsPerPage),
  );

  const paginatedTeachers = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const handleAdd = async (
    values: TeacherFormValues,
  ) => {
    const payload =
      buildTeacherPayload(values);

      

    const data =
      await addteacher(payload);

    if (data) {
      setAddOpen(false);
    }
  };

  const handleEdit = async (values: TeacherFormValues) => {
    if (!editItem?.id) return;

    const payload = {
      id: editItem.id,
      ...buildTeacherPayload(values),
    };

    await updateteacher(payload);

    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;

    const result = await deleteteacher(deleteItem.id);
    
    if (result?.success) {
      await loadTeachers(statusFilter);
    }

    setDeleteItem(null);
  };

  const handleRestore = async () => {
    if (!restoreItem?.id) return;

    const result = await restoreteacher(restoreItem.id);
    
    if (result?.success) {
      await loadTeachers(statusFilter);
    }

    setRestoreItem(null);
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem?.id) return;

    const result = await permanentdeleteteacher(permanentDeleteItem.id);
    
    if (result?.success) {
      await loadTeachers(statusFilter);
    }

    setPermanentDeleteItem(null);
  };

  const handleStatusChange = async (status: StatusFilter) => {
  setStatusFilter(status);
  setPage(1);

  await loadTeachers(status);
};

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    setPage(1);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Teachers" }]} />

      <PageHeader
        title="Teachers"
        description={`${teachers.length} teaching staff members`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            data-testid="add-teacher-btn"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search teachers..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="teachers-search"
            />
          </div>

          <div className="w-full lg:w-55">
            <Select
              value={selectedClassId}
              onValueChange={handleClassChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>

                {classes.map((item) => (
                  <SelectItem
                    key={String(item.id)}
                    value={String(item.id)}
                  >
                    {String(item.class_name ?? "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <StatusTabs
              options={statusTabs}
              value={statusFilter}
              onChange={handleStatusChange}
              disabled={isLoading}
              className="lg:ml-auto"
            />
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={paginatedTeachers.length} />
          ) : (
          <DataTable
            columns={columns}
            data={
              paginatedTeachers as unknown as Record<
                string,
                unknown
              >[]
            }
            onView={(row) =>
              setViewItem(row as unknown as Teacher)
            }
            {...(statusFilter === "trash"
              ? {
                  onRestore: (row) =>
                    setRestoreItem(row as unknown as Teacher),
                  onPermanentDelete: (row) =>
                    setPermanentDeleteItem(row as unknown as Teacher),
                }
              : {
                  onEdit: (row) =>
                    setEditItem(row as unknown as Teacher),
                  onDelete: (row) =>
                    setDeleteItem(row as unknown as Teacher),
                })}
          />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedTeachers.length} of {filtered.length}{" "}
            teachers
          </span>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        title="Teacher Details"
        size="lg"
      >
        {viewItem && (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {makeInitials(
                    viewItem.first_name,
                    viewItem.last_name,
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {getFullName(viewItem)}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {viewItem.employee_code || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <InfoSection title="Basic Information">
                <Info label="Employee Code" value={viewItem.employee_code} />
                <Info label="Name" value={getFullName(viewItem)} />
                <Info label="Email" value={viewItem.email} />
                <Info label="Phone" value={viewItem.phone} />
                <Info
                  label="Alternate Phone"
                  value={viewItem.alternate_phone}
                />
                <Info label="Status" value={viewItem.status} />
              </InfoSection>

              <InfoSection title="Personal Details">
                <Info label="Gender" value={viewItem.gender} />
                <Info
                  label="Date of Birth"
                  value={safeValue(viewItem.date_of_birth)}
                />
                <Info label="Blood Group" value={viewItem.blood_group} />
                <Info
                  label="Marital Status"
                  value={viewItem.marital_status}
                />
              </InfoSection>

              <InfoSection title="Address Details">
                <Info
                  label="Current Address"
                  value={viewItem.current_address}
                  large
                />
                <Info
                  label="Permanent Address"
                  value={viewItem.permanent_address}
                  large
                />
                <Info label="City" value={viewItem.city} />
                <Info label="State" value={viewItem.state} />
                <Info label="Country" value={viewItem.country} />
                <Info label="Pincode" value={viewItem.pincode} />
              </InfoSection>

              <InfoSection title="Professional Details">
                <Info
                  label="Qualification"
                  value={viewItem.qualification}
                />
                <Info
                  label="Specialization"
                  value={viewItem.specialization}
                />
                <Info
                  label="Experience Years"
                  value={safeValue(viewItem.experience_years)}
                />
                <Info
                  label="Joining Date"
                  value={safeValue(viewItem.joining_date)}
                />
                <Info
                  label="Employment Type"
                  value={viewItem.employment_type}
                />
              </InfoSection>

              <InfoSection title="Salary / Bank Details">
                <Info
                  label="Basic Salary"
                  value={safeValue(viewItem.basic_salary)}
                />
                <Info label="Bank Name" value={viewItem.bank_name} />
                <Info
                  label="Bank Account Number"
                  value={viewItem.bank_account_number}
                />
                <Info label="IFSC Code" value={viewItem.ifsc_code} />
                <Info label="PAN Number" value={viewItem.pan_number} />
              </InfoSection>

              <InfoSection title="Emergency Contact">
                <Info
                  label="Emergency Contact Name"
                  value={viewItem.emergency_contact_name}
                />
                <Info
                  label="Emergency Contact Phone"
                  value={viewItem.emergency_contact_phone}
                />
                <Info
                  label="Emergency Contact Relation"
                  value={viewItem.emergency_contact_relation}
                />
              </InfoSection>

              <InfoSection title="Remarks">
                <Info label="Remarks" value={viewItem.remarks} large />
              </InfoSection>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <TeacherFormModal
        isOpen={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onSubmit={handleAdd}
        title="Add New Teacher"
        submitLabel="Add Teacher"
        employeeCodeRules={
          employeeCodeRules
        }
        settingsLoading={
          employeeCodeSettingsLoading
        }
        settingsError={
          employeeCodeSettingsError
        }
      />

      {/* Edit Modal */}
      <TeacherFormModal
        isOpen={Boolean(editItem)}
        onClose={() =>
          setEditItem(null)
        }
        onSubmit={handleEdit}
        title="Edit Teacher"
        initialValues={
          editInitialValues
        }
        submitLabel="Save Changes"
        employeeCodeRules={
          employeeCodeRules
        }
        settingsLoading={
          employeeCodeSettingsLoading
        }
        settingsError={
          employeeCodeSettingsError
        }
      />

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        description={`Are you sure you want to remove "${
          deleteItem ? getFullName(deleteItem) : ""
        }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Teacher"
      />

      <ConfirmModal
        isOpen={Boolean(restoreItem)}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Teacher"
        description={`Are you sure you want to restore "${
          restoreItem ? getFullName(restoreItem) : ""
        }" back to active status?`}
        confirmLabel="Restore Teacher"
      />

      <ConfirmModal
        isOpen={Boolean(permanentDeleteItem)}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Teacher"
        description={`Are you sure you want to permanently delete "${
          permanentDeleteItem ? getFullName(permanentDeleteItem) : ""
        }"? This action CANNOT be undone and all data will be lost forever.`}
        confirmLabel="Permanently Delete"
      />
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h4 className="mb-4 text-sm font-semibold text-foreground">
        {title}
      </h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Info({
  label,
  value,
  large = false,
}: {
  label: string;
  value?: string | null;
  large?: boolean;
}) {
  return (
    <div className={large ? "md:col-span-2" : ""}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="min-h-9.5 wrap-break-word rounded-lg bg-muted/40 px-3 py-2 font-medium text-foreground">
        {value || "-"}
      </p>
    </div>
  );
}