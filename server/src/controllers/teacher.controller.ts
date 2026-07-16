import { NextFunction, Request, Response } from "express";

import {
  TeacherModel,
  TeacherPayload,
  TeacherUpdatePayload,
} from "../models/teachers.model.js";

import { SettingsModel } from "../models/settings.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type TeacherStatusFilter = "all" | "active" | "inactive" | "resigned";

type EmployeeCodeRules =
  | {
      generationType: "auto";
    }
  | {
      generationType: "manual";
      requiredLength: number;
      prefix: string;
    };

const cleanString = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue || undefined;
};

const cleanNumber = (
  value: number | string | undefined | null,
  fieldName: string,
): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }

  return numberValue;
};

/**
 * Read employee-code settings.
 *
 * Auto mode:
 * - The controller does not validate, create, or change employee_code.
 * - The model/database must generate it automatically.
 *
 * Manual mode:
 * - The user sends only the numeric part, for example: "123456".
 * - The controller validates the numeric length.
 * - The controller adds the configured prefix.
 */
const getEmployeeCodeRules = async (): Promise<EmployeeCodeRules> => {
  const [userSettings, systemSettings] = await Promise.all([
    SettingsModel.findByGroup("users"),
    SettingsModel.findByGroup("system"),
  ]);

  const generationSetting = userSettings.find(
    (setting) => setting.key === "employee_code_generated_by",
  );

  if (!generationSetting) {
    throw new AppError(
      "Employee code generation setting is not configured",
      500,
    );
  }

  const generationType = String(generationSetting.value ?? "")
    .trim()
    .toLowerCase();

  if (generationType !== "auto" && generationType !== "manual") {
    throw new AppError(
      "Employee code generation setting must be auto or manual",
      500,
    );
  }

  
  if (generationType === "auto") {
    return {
      generationType: "auto",
    };
  }

  const lengthSetting = userSettings.find(
    (setting) => setting.key === "employee_code_length",
  );

  const prefixSetting = systemSettings.find(
    (setting) => setting.key === "employee_code_prefix",
  );
  console.log(prefixSetting)

  if (!lengthSetting) {
    throw new AppError("Employee code length setting is not configured", 500);
  }

  if (!prefixSetting) {
    throw new AppError("Employee code prefix setting is not configured", 500);
  }

  const requiredLength = Number(lengthSetting.value);

  if (!Number.isInteger(requiredLength) || requiredLength <= 0) {
    throw new AppError(
      "Employee code length setting must be a positive integer",
      500,
    );
  }

  const prefix = String(prefixSetting.value ?? "")
    .trim()
    .toUpperCase();

  if (!prefix) {
    throw new AppError("Employee code prefix cannot be empty", 500);
  }

  return {
    generationType: "manual",
    requiredLength,
    prefix,
  };
};

/**
 * Validate the manually entered employee-code number.
 *
 * The frontend sends only the numeric part:
 * "123456"
 *
 * The controller returns:
 * "GHSH123456"
 */
const buildManualEmployeeCode = (
  employeeCode: string | undefined,
  rules: Extract<EmployeeCodeRules, { generationType: "manual" }>,
): string => {
  const numericCode = cleanString(employeeCode);

  if (!numericCode) {
    throw new AppError(
      "Employee code is required when manual generation is enabled",
      400,
    );
  }

  if (!/^\d+$/.test(numericCode)) {
    throw new AppError("Employee code must contain numbers only", 400);
  }

  if (numericCode.length !== rules.requiredLength) {
    throw new AppError(
      `Employee code must contain exactly ${rules.requiredLength} digits`,
      400,
    );
  }

  return `${rules.prefix}${numericCode}`;
};

const validateTeacherStatus = (status?: string): string | undefined => {
  const cleanedStatus = cleanString(status)?.toLowerCase();

  if (!cleanedStatus) {
    return undefined;
  }

  const allowedStatuses = ["active", "inactive", "resigned"];

  if (!allowedStatuses.includes(cleanedStatus)) {
    throw new AppError(
      "Teacher status must be active, inactive, or resigned",
      400,
    );
  }

  return cleanedStatus;
};

export class TeacherController {
  static findAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const statusParam = req.query.status;

      let status: TeacherStatusFilter = "all";

      if (typeof statusParam === "string" && statusParam.trim() !== "") {
        const normalizedStatus = statusParam.trim().toLowerCase();

        const allowedStatuses: TeacherStatusFilter[] = [
          "all",
          "active",
          "inactive",
          "resigned",
        ];

        if (
          !allowedStatuses.includes(normalizedStatus as TeacherStatusFilter)
        ) {
          return next(new AppError("Invalid teacher status filter", 400));
        }

        status = normalizedStatus as TeacherStatusFilter;
      }

      const teachers = await TeacherModel.findAll(status);

      res.status(200).json({
        success: true,
        message: "Teachers fetched successfully",
        data: teachers,
      });
    },
  );

  static findById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid teacher ID", 400));
      }

      const teacher = await TeacherModel.findById(id);

      if (!teacher) {
        return next(new AppError("Teacher not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Teacher fetched successfully",
        data: teacher,
      });
    },
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        first_name,
        last_name,
        employee_code,
        email,
        phone,
        alternate_phone,

        gender,
        date_of_birth,
        blood_group,
        marital_status,

        current_address,
        permanent_address,
        city,
        state,
        country,
        pincode,

        qualification,
        specialization,
        experience_years,
        joining_date,
        employment_type,
        status,

        basic_salary,
        bank_name,
        bank_account_number,
        ifsc_code,
        pan_number,

        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,

        profile_image,
        remarks,
      } = req.body as TeacherPayload;

      const cleanedFirstName = cleanString(first_name);

      if (!cleanedFirstName) {
        return next(new AppError("First name is required", 400));
      }

      const employeeCodeRules = await getEmployeeCodeRules();

      let finalEmployeeCode: string | undefined;

      if (employeeCodeRules.generationType === "manual") {
        /**
         * The user sends only the numeric part.
         * The controller attaches the prefix.
         */
        finalEmployeeCode = buildManualEmployeeCode(
          employee_code,
          employeeCodeRules,
        );
      } else {
        /**
         * Auto mode:
         * Do not use an employee code from the request.
         * The model/database must generate the code.
         */
        finalEmployeeCode = undefined;
      }

      const cleanedEmail = cleanString(email)?.toLowerCase();

      const cleanedExperienceYears = cleanNumber(
        experience_years,
        "Experience years",
      );

      if (cleanedExperienceYears !== undefined && cleanedExperienceYears < 0) {
        return next(new AppError("Experience years cannot be negative", 400));
      }

      const cleanedBasicSalary = cleanNumber(basic_salary, "Basic salary");

      if (cleanedBasicSalary !== undefined && cleanedBasicSalary < 0) {
        return next(new AppError("Basic salary cannot be negative", 400));
      }

      const teacher = await TeacherModel.create({
        first_name: cleanedFirstName,

        last_name: cleanString(last_name),

        /**
         * Undefined in auto mode.
         * The model/database must generate it.
         */
        employee_code: finalEmployeeCode,

        email: cleanedEmail,

        phone: cleanString(phone),

        alternate_phone: cleanString(alternate_phone),

        gender: cleanString(gender)?.toLowerCase(),

        date_of_birth: cleanString(date_of_birth),

        blood_group: cleanString(blood_group)?.toUpperCase(),

        marital_status: cleanString(marital_status)?.toLowerCase(),

        current_address: cleanString(current_address),

        permanent_address: cleanString(permanent_address),

        city: cleanString(city),

        state: cleanString(state),

        country: cleanString(country),

        pincode: cleanString(pincode),

        qualification: cleanString(qualification),

        specialization: cleanString(specialization),

        experience_years: cleanedExperienceYears,

        joining_date: cleanString(joining_date),

        employment_type: cleanString(employment_type),

        status: validateTeacherStatus(status) || "active",

        basic_salary: cleanedBasicSalary,

        bank_name: cleanString(bank_name),

        bank_account_number: cleanString(bank_account_number),

        ifsc_code: cleanString(ifsc_code)?.toUpperCase(),

        pan_number: cleanString(pan_number)?.toUpperCase(),

        emergency_contact_name: cleanString(emergency_contact_name),

        emergency_contact_phone: cleanString(emergency_contact_phone),

        emergency_contact_relation: cleanString(emergency_contact_relation),

        profile_image: cleanString(profile_image),

        remarks: cleanString(remarks),
      });

      res.status(201).json({
        success: true,
        message: "Teacher created successfully",
        data: teacher,
      });
    },
  );

  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.body.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid teacher ID", 400));
      }

      const existingTeacher = await TeacherModel.findById(id);

      if (!existingTeacher) {
        return next(new AppError("Teacher not found", 404));
      }

      const {
        first_name,
        last_name,
        employee_code,
        email,
        phone,
        alternate_phone,

        gender,
        date_of_birth,
        blood_group,
        marital_status,

        current_address,
        permanent_address,
        city,
        state,
        country,
        pincode,

        qualification,
        specialization,
        experience_years,
        joining_date,
        employment_type,
        status,

        basic_salary,
        bank_name,
        bank_account_number,
        ifsc_code,
        pan_number,

        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,

        profile_image,
        remarks,
      } = req.body as TeacherUpdatePayload & {
        id: number;
      };

      let finalEmployeeCode: string | undefined;

      const employeeCodeWasProvided = Object.prototype.hasOwnProperty.call(
        req.body,
        "employee_code",
      );

      if (employeeCodeWasProvided) {
        const employeeCodeRules = await getEmployeeCodeRules();

        if (employeeCodeRules.generationType === "manual") {
          /**
           * Manual mode:
           * Validate only the numeric part and
           * attach the prefix before update.
           */
          finalEmployeeCode = buildManualEmployeeCode(
            employee_code,
            employeeCodeRules,
          );
        } else {
          /**
           * Auto mode:
           * Ignore employee_code from the request.
           * Never regenerate or change an existing
           * teacher code during a normal update.
           */
          finalEmployeeCode = undefined;
        }
      }

      const cleanedEmail =
        email === undefined ? undefined : cleanString(email)?.toLowerCase();

      const cleanedExperienceYears = cleanNumber(
        experience_years,
        "Experience years",
      );

      if (cleanedExperienceYears !== undefined && cleanedExperienceYears < 0) {
        return next(new AppError("Experience years cannot be negative", 400));
      }

      const cleanedBasicSalary = cleanNumber(basic_salary, "Basic salary");

      if (cleanedBasicSalary !== undefined && cleanedBasicSalary < 0) {
        return next(new AppError("Basic salary cannot be negative", 400));
      }

      const updatePayload: TeacherUpdatePayload = {
        first_name: cleanString(first_name),

        last_name: cleanString(last_name),

        /**
         * Undefined in auto mode, so the model
         * keeps the existing employee code.
         */
        employee_code: finalEmployeeCode,

        email: cleanedEmail,

        phone: cleanString(phone),

        alternate_phone: cleanString(alternate_phone),

        gender: cleanString(gender)?.toLowerCase(),

        date_of_birth: cleanString(date_of_birth),

        blood_group: cleanString(blood_group)?.toUpperCase(),

        marital_status: cleanString(marital_status)?.toLowerCase(),

        current_address: cleanString(current_address),

        permanent_address: cleanString(permanent_address),

        city: cleanString(city),

        state: cleanString(state),

        country: cleanString(country),

        pincode: cleanString(pincode),

        qualification: cleanString(qualification),

        specialization: cleanString(specialization),

        experience_years: cleanedExperienceYears,

        joining_date: cleanString(joining_date),

        employment_type: cleanString(employment_type),

        status: validateTeacherStatus(status),

        basic_salary: cleanedBasicSalary,

        bank_name: cleanString(bank_name),

        bank_account_number: cleanString(bank_account_number),

        ifsc_code: cleanString(ifsc_code)?.toUpperCase(),

        pan_number: cleanString(pan_number)?.toUpperCase(),

        emergency_contact_name: cleanString(emergency_contact_name),

        emergency_contact_phone: cleanString(emergency_contact_phone),

        emergency_contact_relation: cleanString(emergency_contact_relation),

        profile_image: cleanString(profile_image),

        remarks: cleanString(remarks),
      };

      const hasAtLeastOneUpdate = Object.values(updatePayload).some(
        (value) => value !== undefined,
      );

      if (!hasAtLeastOneUpdate) {
        return next(
          new AppError(
            "At least one valid field is required to update teacher",
            400,
          ),
        );
      }

      const teacher = await TeacherModel.update(id, updatePayload);

      if (!teacher) {
        return next(new AppError("Teacher not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Teacher updated successfully",
        data: teacher,
      });
    },
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(new AppError("Invalid teacher ID", 400));
      }

      const teacher = await TeacherModel.delete(id);

      if (!teacher) {
        return next(new AppError("Teacher not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Teacher deleted successfully",
        data: teacher,
      });
    },
  );
}
