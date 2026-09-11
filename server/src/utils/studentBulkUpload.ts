import ExcelJS from "exceljs";

export type StudentBulkUploadSettings = {
  generationType: "auto" | "manual";
  prefix: string;
  requiredLength: number;
};

export type StudentBulkUploadRecord = {
  first_name?: string;
  last_name?: string;
  student_code?: string;
  email?: string;
  phone?: string;
  password?: string;
  status?: string;
  class_section_id?: number | string;
};

export type StudentBulkUploadContext = {
  existingEmails: Set<string>;
  existingPhones: Set<string>;
  existingStudentCodes: Set<string>;
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

export const parseStudentBulkRows = async (
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

export const validateStudentBulkRow = async (
  rawRow: Record<string, unknown>,
  settings: StudentBulkUploadSettings,
  context: StudentBulkUploadContext,
): Promise<{
  valid: boolean;
  errors: string[];
  normalized: StudentBulkUploadRecord | null;
}> => {
  const record = normalizeBulkRecord(rawRow);

  const errors: string[] = [];

  const firstName = cleanString(record.firstname ?? record.first_name ?? record.firstname);
  if (!firstName) {
    errors.push("First name is required");
  }

  const lastName = cleanString(record.lastname ?? record.last_name);
  const email = cleanString(record.email)?.toLowerCase();
  const phone = cleanString(record.phone);
  const password = cleanString(record.password);
  const status = cleanString(record.status)?.toLowerCase();

  if (!email && !phone) {
    errors.push("At least one of email or phone is required so the student can log in");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email is invalid");
  }

  if (phone && !/^[+]?\d[\d\s()-]{6,20}$/.test(phone)) {
    errors.push("Phone number is invalid");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (status && !["active", "inactive"].includes(status)) {
    errors.push("Student status must be active or inactive");
  }

  const normalizedStatus = status ?? "active";

  if (email && context.existingEmails.has(email)) {
    errors.push("Email already exists");
  }

  if (phone && context.existingPhones.has(phone)) {
    errors.push("Phone already exists");
  }

  const studentCodeValue = cleanString(record.studentcode ?? record.student_code);
  const normalizedStudentCode = studentCodeValue ? studentCodeValue.trim() : undefined;

  if (settings.generationType === "manual") {
    if (!normalizedStudentCode) {
      errors.push("Student code is required when manual generation is enabled");
    } else if (!/^\d+$/.test(normalizedStudentCode)) {
      errors.push("Student code must contain numbers only");
    } else if (normalizedStudentCode.length !== settings.requiredLength) {
      errors.push(`Student code must contain exactly ${settings.requiredLength} digits`);
    } else {
      const prefixedCode = `${settings.prefix}${normalizedStudentCode}`;
      if (context.existingStudentCodes.has(prefixedCode)) {
        errors.push("Student code already exists");
      }
    }
  }

  const classSectionId = parseOptionalInteger(record.class_section_id ?? record.classsectionid);

  const normalized: StudentBulkUploadRecord = {
    first_name: firstName,
    last_name: lastName,
    student_code: normalizedStudentCode,
    email,
    phone,
    password,
    status: normalizedStatus,
    class_section_id: classSectionId,
  };

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? normalized : null,
  };
};
