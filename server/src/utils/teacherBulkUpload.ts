import ExcelJS from "exceljs";

export type TeacherBulkUploadSettings = {
  generationType: "auto" | "manual";
  prefix: string;
  requiredLength: number;
};

export type TeacherBulkUploadRecord = {
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  email?: string;
  phone?: string;
  password?: string;
  status?: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  marital_status?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number | string;
  joining_date?: string;
  employment_type?: string;
  basic_salary?: number | string;
  remarks?: string;
};

export type TeacherBulkUploadContext = {
  existingEmails: Set<string>;
  existingPhones: Set<string>;
  existingEmployeeCodes: Set<string>;
};

const normalizeKey = (value: string): string =>
  value.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

const cleanString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;

  const text = typeof value === "string" ? value.trim() : String(value).trim();

  return text !== "" ? text : undefined;
};

const parseOptionalInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeBulkRecord = (raw: Record<string, unknown>): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  Object.entries(raw).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value;
  });

  return normalized;
};

const parseCsvRows = (csvText: string): Record<string, unknown>[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine
    .split(",")
    .map((cell) => cell.trim().replace(/^"|"$/g, ""));

  return dataLines.map((line) => {
    const values = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const record: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = values[index] ?? "";
    });

    return record;
  });
};

export const parseTeacherBulkRows = async (
  fileBuffer: Buffer,
  originalName: string,
): Promise<Record<string, unknown>[]> => {
  const extension = originalName.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsvRows(fileBuffer.toString("utf8"));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const values = worksheet.getSheetValues();
  if (values.length < 2) {
    return [];
  }

  const headerRow = values[1] as unknown[];
  const headers = headerRow.map((cell) => String(cell ?? "").trim());

  const rows: Record<string, unknown>[] = [];

  for (let rowIndex = 2; rowIndex <= values.length; rowIndex += 1) {
    const rawRow = values[rowIndex] as unknown[] | undefined;
    if (!rawRow || rawRow.every((cell) => cell === null || cell === undefined || String(cell).trim() === "")) {
      continue;
    }

    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = rawRow[index];
    });

    rows.push(record);
  }

  return rows;
};

export const validateTeacherBulkRow = async (
  rawRow: Record<string, unknown>,
  settings: TeacherBulkUploadSettings,
  context: TeacherBulkUploadContext,
): Promise<{
  valid: boolean;
  errors: string[];
  normalized: TeacherBulkUploadRecord | null;
}> => {
  const record = normalizeBulkRecord(rawRow);
  const errors: string[] = [];

  const firstName = cleanString(record.firstname ?? record.first_name);
  if (!firstName) {
    errors.push("First name is required");
  }

  const lastName = cleanString(record.lastname ?? record.last_name);
  const email = cleanString(record.email)?.toLowerCase();
  const phone = cleanString(record.phone);
  const password = cleanString(record.password);
  const status = cleanString(record.status)?.toLowerCase();

  if (!email && !phone) {
    errors.push("At least one of email or phone is required");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email is invalid");
  }

  if (phone && !/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
    errors.push("Phone number is invalid");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (status && !["active", "inactive", "resigned"].includes(status)) {
    errors.push("Teacher status must be active, inactive, or resigned");
  }

  const employeeCodeValue = cleanString(record.employeecode ?? record.employee_code);
  const normalizedEmployeeCode = employeeCodeValue ? employeeCodeValue.trim() : undefined;

  if (settings.generationType === "manual") {
    if (!normalizedEmployeeCode) {
      errors.push("Employee code is required when manual generation is enabled");
    } else if (!/^\d+$/.test(normalizedEmployeeCode)) {
      errors.push("Employee code must contain numbers only");
    } else if (normalizedEmployeeCode.length !== settings.requiredLength) {
      errors.push(`Employee code must contain exactly ${settings.requiredLength} digits`);
    } else if (context.existingEmployeeCodes.has(`${settings.prefix}${normalizedEmployeeCode}`)) {
      errors.push("Employee code already exists");
    }
  }

  if (email && context.existingEmails.has(email)) {
    errors.push("Email already exists");
  }

  if (phone && context.existingPhones.has(phone)) {
    errors.push("Phone already exists");
  }

  const experienceYears = parseOptionalInteger(record.experience_years ?? record.experienceyears);
  if (experienceYears !== undefined && experienceYears < 0) {
    errors.push("Experience years cannot be negative");
  }

  const basicSalary = parseOptionalInteger(record.basic_salary ?? record.basicsalary);
  if (basicSalary !== undefined && basicSalary < 0) {
    errors.push("Basic salary cannot be negative");
  }

  const normalized: TeacherBulkUploadRecord = {
    first_name: firstName,
    last_name: lastName,
    employee_code: normalizedEmployeeCode,
    email,
    phone,
    password,
    status: status ?? "active",
    gender: cleanString(record.gender),
    date_of_birth: cleanString(record.date_of_birth ?? record.dateofbirth),
    blood_group: cleanString(record.blood_group ?? record.bloodgroup),
    marital_status: cleanString(record.marital_status ?? record.maritalstatus),
    qualification: cleanString(record.qualification),
    specialization: cleanString(record.specialization),
    experience_years: experienceYears,
    joining_date: cleanString(record.joining_date ?? record.joiningdate),
    employment_type: cleanString(record.employment_type ?? record.employmenttype),
    basic_salary: basicSalary,
    remarks: cleanString(record.remarks),
  };

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? normalized : null,
  };
};
