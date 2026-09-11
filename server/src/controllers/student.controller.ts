import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import multer from "multer";

import {
  StudentModel,
  StudentCreateData,
  StudentStatusFilter,
  StudentUpdateData,
} from "../models/student.model.js";
import { SettingsModel } from "../models/settings.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  parseStudentBulkRows,
  validateStudentBulkRow,
} from "../utils/studentBulkUpload.js";

export const uploadStudentBulkFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [".csv", ".xls", ".xlsx"];
    const extension = file.originalname.split(".").pop()?.toLowerCase();

    if (file.mimetype.includes("spreadsheet") || file.mimetype.includes("csv") || extension && allowedExtensions.includes(`.${extension}`)) {
      cb(null, true);
      return;
    }

    cb(new AppError("Only .csv, .xls, and .xlsx files are allowed", 400));
  },
}).single("file");

type AutoStudentCodeRules = {
  generationType: "auto";
  requiredLength: number;
  prefix: string;
};

type ManualStudentCodeRules = {
  generationType: "manual";
  requiredLength: number;
  prefix: string;
};

type StudentCodeRules = AutoStudentCodeRules | ManualStudentCodeRules;

type PostgreSQLError = Error & {
  code?: string;
  constraint?: string;
};

const STUDENT_CODE_MAXIMUM_ATTEMPTS = 20;
const VALID_STATUS_FILTERS: StudentStatusFilter[] = [
  "all",
  "active",
  "inactive",
  "trash",
];

const cleanString = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue || undefined;
};

// Mirrors teacher.controller.ts's getEmployeeCodeRules(), reading the
// "students" setting group instead of "users".
const getStudentCodeRules = async (): Promise<StudentCodeRules> => {
  const studentSettings = await SettingsModel.findByGroup("students");

  const generationSetting = studentSettings.find(
    (setting) => setting.key === "student_code_generated_by",
  );

  const lengthSetting = studentSettings.find(
    (setting) => setting.key === "student_code_length",
  );

  const prefixSetting = studentSettings.find(
    (setting) => setting.key === "student_code_prefix",
  );

  if (!generationSetting) {
    throw new AppError(
      "Student code generation setting is not configured",
      500,
    );
  }

  if (!lengthSetting) {
    throw new AppError("Student code length setting is not configured", 500);
  }

  if (!prefixSetting) {
    throw new AppError("Student code prefix setting is not configured", 500);
  }

  const generationType = String(generationSetting.value ?? "")
    .trim()
    .toLowerCase();

  if (generationType !== "auto" && generationType !== "manual") {
    throw new AppError(
      "Student code generation setting must be auto or manual",
      500,
    );
  }

  const requiredLength = Number(lengthSetting.value);

  if (!Number.isInteger(requiredLength) || requiredLength <= 0) {
    throw new AppError(
      "Student code length setting must be a positive integer",
      500,
    );
  }

  const prefix = String(prefixSetting.value ?? "")
    .trim()
    .toUpperCase();

  if (!prefix) {
    throw new AppError("Student code prefix cannot be empty", 500);
  }

  return { generationType, requiredLength, prefix } as StudentCodeRules;
};

const buildManualStudentCode = (
  studentCode: string | undefined,
  rules: ManualStudentCodeRules,
): string => {
  const numericCode = cleanString(studentCode);

  if (!numericCode) {
    throw new AppError(
      "Student code is required when manual generation is enabled",
      400,
    );
  }

  if (!/^\d+$/.test(numericCode)) {
    throw new AppError("Student code must contain numbers only", 400);
  }

  if (numericCode.length !== rules.requiredLength) {
    throw new AppError(
      `Student code must contain exactly ${rules.requiredLength} digits`,
      400,
    );
  }

  return `${rules.prefix}${numericCode}`;
};

const autoStudentCodeGeneration = async (
  rules: AutoStudentCodeRules,
): Promise<string> => {
  const totalLength = rules.prefix.length + rules.requiredLength;

  for (
    let attempt = 1;
    attempt <= STUDENT_CODE_MAXIMUM_ATTEMPTS;
    attempt += 1
  ) {
    const generatedStudentCode = await StudentModel.generateStudentCode(
      rules.prefix,
      totalLength,
    );

    const alreadyExists = await StudentModel.alreadyExists(
      "student_code",
      generatedStudentCode,
    );

    if (!alreadyExists) {
      return generatedStudentCode;
    }
  }

  throw new AppError("Unable to generate a unique student code", 500);
};

const validateStudentStatus = (status?: string): string | undefined => {
  const cleanedStatus = cleanString(status)?.toLowerCase();

  if (!cleanedStatus) {
    return undefined;
  }

  if (!["active", "inactive"].includes(cleanedStatus)) {
    throw new AppError("Student status must be active or inactive", 400);
  }

  return cleanedStatus;
};

export class StudentController {
  static findAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const statusParam = req.query.status;
      const pageParam = req.query.page;
      const limitParam = req.query.limit;

      let status: StudentStatusFilter = "all";

      if (typeof statusParam === "string" && statusParam.trim() !== "") {
        const normalizedStatus = statusParam.trim().toLowerCase();

        if (
          !VALID_STATUS_FILTERS.includes(
            normalizedStatus as StudentStatusFilter,
          )
        ) {
          return next(new AppError("Invalid student status filter", 400));
        }

        status = normalizedStatus as StudentStatusFilter;
      }

      const pageValue = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam ?? "1");
      const limitValue = Number(Array.isArray(limitParam) ? limitParam[0] : limitParam ?? "10");

      const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
      const limit = [5, 10, 20].includes(limitValue) ? limitValue : 10;

      const result = await StudentModel.findByStatus(status, page, limit);

      res.status(200).json({
        success: true,
        message: "Students fetched successfully",
        data: result,
      });
    },
  );

  static findById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid student ID", 400));
      }

      const student = await StudentModel.findById(id);

      if (!student) {
        return next(new AppError("Student not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student fetched successfully",
        data: student,
      });
    },
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body as Record<string, unknown>;

      const firstName = cleanString(body.first_name as string);
      if (!firstName) {
        return next(new AppError("First name is required", 400));
      }

      const password = String(body.password ?? "");
      if (password.length < 6) {
        return next(
          new AppError("Password must be at least 6 characters", 400),
        );
      }

      const email = cleanString(body.email as string)?.toLowerCase();
      const phone = cleanString(body.phone as string);

      if (!email && !phone) {
        return next(
          new AppError(
            "At least one of email or phone is required so the student can log in",
            400,
          ),
        );
      }

      const studentCodeRules = await getStudentCodeRules();
      let finalStudentCode: string;

      if (studentCodeRules.generationType === "manual") {
        finalStudentCode = buildManualStudentCode(
          body.student_code as string | undefined,
          studentCodeRules,
        );

        const alreadyExists = await StudentModel.alreadyExists(
          "student_code",
          finalStudentCode,
        );

        if (alreadyExists) {
          return next(new AppError("Student code already exists", 409));
        }
      } else {
        finalStudentCode = await autoStudentCodeGeneration(studentCodeRules);
      }

      if (email) {
        const emailExists = await StudentModel.alreadyExists("email", email);
        if (emailExists) {
          return next(new AppError("Email already exists", 409));
        }
      }

      if (phone) {
        const phoneExists = await StudentModel.alreadyExists("phone", phone);
        if (phoneExists) {
          return next(new AppError("Phone already exists", 409));
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const classSectionId = Number(body.class_section_id);
      const hasClassAssignment =
        Number.isInteger(classSectionId) && classSectionId > 0;

     
      const meta =
        body.meta && typeof body.meta === "object"
          ? (body.meta as StudentCreateData["meta"])
          : undefined;

      const createData: StudentCreateData = {
        student_code: finalStudentCode,
        first_name: firstName,
        last_name: cleanString(body.last_name as string),
        email,
        phone,
        hashedPassword,
        status: validateStudentStatus(body.status as string) || "active",
        meta,
        classAssignment: hasClassAssignment
          ? { class_section_id: classSectionId }
          : undefined,
      };

      try {
        const student = await StudentModel.create(createData);

        res.status(201).json({
          success: true,
          message: "Student created successfully",
          data: student,
        });
      } catch (error) {
        const postgresError = error as PostgreSQLError;

        if (postgresError.code === "23505") {
          return next(
            new AppError("A unique student value already exists", 409),
          );
        }

        throw error;
      }
    },
  );

  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.body.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid student ID", 400));
      }

      const existingStudent = await StudentModel.findById(id);
      if (!existingStudent) {
        return next(new AppError("Student not found", 404));
      }

      const body = req.body as Record<string, unknown>;

      if (
        Object.prototype.hasOwnProperty.call(body, "email") &&
        cleanString(body.email as string)
      ) {
        const email = cleanString(body.email as string)!.toLowerCase();
        const emailExists = await StudentModel.alreadyExists(
          "email",
          email,
          id,
        );
        if (emailExists) {
          return next(new AppError("Email already exists", 409));
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(body, "phone") &&
        cleanString(body.phone as string)
      ) {
        const phone = cleanString(body.phone as string)!;
        const phoneExists = await StudentModel.alreadyExists(
          "phone",
          phone,
          id,
        );
        if (phoneExists) {
          return next(new AppError("Phone already exists", 409));
        }
      }

      let hashedPassword: string | undefined;
      const rawPassword = cleanString(body.password as string);
      if (rawPassword) {
        if (rawPassword.length < 6) {
          return next(
            new AppError("Password must be at least 6 characters", 400),
          );
        }
        hashedPassword = await bcrypt.hash(rawPassword, 10);
      }
      const classSectionId = Number(body.class_section_id);

      const hasClassSectionUpdate =
        Object.prototype.hasOwnProperty.call(body, "class_section_id") &&
        Number.isInteger(classSectionId) &&
        classSectionId > 0;

      const updateData: StudentUpdateData = {
        first_name: cleanString(body.first_name as string),
        last_name: cleanString(body.last_name as string),
        class_section_id: hasClassSectionUpdate ? classSectionId : undefined,
        email: Object.prototype.hasOwnProperty.call(body, "email")
          ? (cleanString(body.email as string)?.toLowerCase() ?? null)
          : undefined,
        phone: Object.prototype.hasOwnProperty.call(body, "phone")
          ? (cleanString(body.phone as string) ?? null)
          : undefined,
        hashedPassword,
        status: validateStudentStatus(body.status as string),
        // Dynamic key/value profile fields — see the note in create(). Only
        // keys present in `meta` are touched; anything else on the student
        // stays as-is.
        meta:
          body.meta && typeof body.meta === "object"
            ? (body.meta as StudentUpdateData["meta"])
            : undefined,
      };

      try {
        const student = await StudentModel.update(id, updateData);

        if (!student) {
          return next(new AppError("Student not found", 404));
        }

        res.status(200).json({
          success: true,
          message: "Student updated successfully",
          data: student,
        });
      } catch (error) {
        const postgresError = error as PostgreSQLError;

        if (postgresError.code === "23505") {
          return next(
            new AppError("A unique student value already exists", 409),
          );
        }

        throw error;
      }
    },
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid student ID", 400));
      }

      const student = await StudentModel.delete(id);

      if (!student) {
        return next(new AppError("Student not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student moved to trash successfully",
        data: student,
      });
    },
  );

  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid student ID", 400));
      }

      const student = await StudentModel.restore(id);

      if (!student) {
        return next(new AppError("Student not found in trash", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student restored successfully",
        data: student,
      });
    },
  );

  static permanentDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid student ID", 400));
      }

      const deleted = await StudentModel.hardDelete(id);

      if (!deleted) {
        return next(new AppError("Student not found or already deleted", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student permanently deleted successfully",
      });
    },
  );

  static bulkUpload = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return next(new AppError("Please upload a CSV or Excel file", 400));
      }

      const settings = await getStudentCodeRules();
      const rawRows = await parseStudentBulkRows(req.file.buffer, req.file.originalname);

      if (rawRows.length === 0) {
        return next(new AppError("The uploaded spreadsheet does not contain any rows", 400));
      }

      const existingRows = (
        await StudentModel.findByStatus("all", 1, Number.MAX_SAFE_INTEGER)
      ).students;
      const existingEmails = new Set<string>(
        existingRows
          .map((student) => student.email)
          .filter((email): email is string => Boolean(email))
          .map((email) => email.trim().toLowerCase()),
      );
      const existingPhones = new Set<string>(
        existingRows
          .map((student) => student.phone)
          .filter((phone): phone is string => Boolean(phone))
          .map((phone) => phone.trim()),
      );
      const existingStudentCodes = new Set<string>(
        existingRows
          .map((student) => student.student_code)
          .filter((studentCode): studentCode is string => Boolean(studentCode))
          .map((studentCode) => studentCode.trim().toUpperCase()),
      );

      const validRows: Array<{
        rowNumber: number;
        createData: StudentCreateData;
      }> = [];
      const invalidRows: Array<{ rowNumber: number; errors: string[] }> = [];

      for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex += 1) {
        const row = rawRows[rowIndex];

        const result = await validateStudentBulkRow(
          row,
          {
            generationType: settings.generationType,
            prefix: settings.prefix,
            requiredLength: settings.requiredLength,
          },
          {
            existingEmails,
            existingPhones,
            existingStudentCodes,
          },
        );

        if (!result.valid || !result.normalized) {
          invalidRows.push({
            rowNumber: rowIndex + 2,
            errors: result.errors,
          });
          continue;
        }

        const normalizedRow = result.normalized;
        const classSectionId = normalizedRow.class_section_id ? Number(normalizedRow.class_section_id) : undefined;

        let finalStudentCode = normalizedRow.student_code;
        if (settings.generationType === "auto") {
          finalStudentCode = await StudentModel.generateStudentCode(
            settings.prefix,
            settings.prefix.length + settings.requiredLength,
          );
        }

        if (finalStudentCode) {
          const formattedStudentCode = finalStudentCode.trim().toUpperCase();
          if (existingStudentCodes.has(formattedStudentCode)) {
            invalidRows.push({
              rowNumber: rowIndex + 2,
              errors: ["Student code already exists"],
            });
            continue;
          }
          existingStudentCodes.add(formattedStudentCode);
        }

        if (normalizedRow.email) {
          const email = normalizedRow.email.trim().toLowerCase();
          if (existingEmails.has(email)) {
            invalidRows.push({
              rowNumber: rowIndex + 2,
              errors: ["Email already exists"],
            });
            continue;
          }
          existingEmails.add(email);
        }

        if (normalizedRow.phone) {
          const phone = normalizedRow.phone.trim();
          if (existingPhones.has(phone)) {
            invalidRows.push({
              rowNumber: rowIndex + 2,
              errors: ["Phone already exists"],
            });
            continue;
          }
          existingPhones.add(phone);
        }

        const password = normalizedRow.password ?? "";
        const hashedPassword = await bcrypt.hash(password, 10);

        validRows.push({
          rowNumber: rowIndex + 2,
          createData: {
            student_code: finalStudentCode ?? "",
            first_name: normalizedRow.first_name ?? "",
            last_name: normalizedRow.last_name,
            email: normalizedRow.email,
            phone: normalizedRow.phone,
            hashedPassword,
            status: normalizedRow.status ?? "active",
            classAssignment:
              Number.isInteger(classSectionId) && classSectionId! > 0
                ? { class_section_id: classSectionId! }
                : undefined,
          },
        });
      }

      if (validRows.length > 0) {
        const remainingValidRows: Array<{ rowNumber: number; createData: StudentCreateData }> = [];

        for (const validRow of validRows) {
          try {
            await StudentModel.create(validRow.createData);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to create student";
            invalidRows.push({
              rowNumber: validRow.rowNumber,
              errors: [message],
            });
          }

          if (!invalidRows.some((row) => row.rowNumber === validRow.rowNumber)) {
            remainingValidRows.push(validRow);
          }
        }

        validRows.length = 0;
        remainingValidRows.forEach((row) => validRows.push(row));
      }

      if (invalidRows.length > 0) {
        res.status(400).json({
          success: false,
          message:
            validRows.length > 0
              ? `Bulk upload completed with ${validRows.length} valid record(s) and ${invalidRows.length} invalid row(s).`
              : "Bulk upload failed because the submitted data contains invalid rows.",
          data: {
            inserted: validRows.length,
            invalidRows,
          },
          errors: invalidRows,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: `${validRows.length} student record(s) uploaded successfully`,
        data: {
          inserted: validRows.length,
          invalidRows: [],
        },
      });
    },
  );
}
