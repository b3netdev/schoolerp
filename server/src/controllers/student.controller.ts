import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";

import {
  StudentModel,
  StudentCreateData,
  StudentStatusFilter,
  StudentUpdateData,
} from "../models/student.model.js";
import { SettingsModel } from "../models/settings.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

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

      const students = await StudentModel.findByStatus(status);

      res.status(200).json({
        success: true,
        message: "Students fetched successfully",
        data: students,
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

      // student_meta is a dynamic key/value store (see student.model.ts) —
      // whatever the caller nests under `meta` is stored as-is, with the
      // value's JS type (string/number/boolean/object) recorded alongside
      // it so it round-trips correctly. No fixed set of profile fields.
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

      const updateData: StudentUpdateData = {
        first_name: cleanString(body.first_name as string),
        last_name: cleanString(body.last_name as string),
        email: Object.prototype.hasOwnProperty.call(body, "email")
          ? cleanString(body.email as string)?.toLowerCase() ?? null
          : undefined,
        phone: Object.prototype.hasOwnProperty.call(body, "phone")
          ? cleanString(body.phone as string) ?? null
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
        return next(
          new AppError("Student not found or already deleted", 404),
        );
      }

      res.status(200).json({
        success: true,
        message: "Student permanently deleted successfully",
      });
    },
  );
}
