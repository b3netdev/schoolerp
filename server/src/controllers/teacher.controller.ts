import { NextFunction, Request, Response } from "express";

import {
  TeacherModel,
  TeacherPayload,
  TeacherUpdatePayload,
} from "../models/teachers.model.js";

import { SettingsModel } from "../models/settings.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type TeacherStatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "resigned"
  | "trash";

type AutoEmployeeCodeRules = {
  generationType: "auto";
  requiredLength: number;
  prefix: string;
};

type ManualEmployeeCodeRules = {
  generationType: "manual";
  requiredLength: number;
  prefix: string;
};

type EmployeeCodeRules =
  | AutoEmployeeCodeRules
  | ManualEmployeeCodeRules;

type PostgreSQLError = Error & {
  code?: string;
  constraint?: string;
};

const EMPLOYEE_CODE_MAXIMUM_ATTEMPTS = 20;

const cleanString = (
  value?: string | null,
): string | undefined => {
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
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new AppError(
      `${fieldName} must be a valid number`,
      400,
    );
  }

  return numberValue;
};

const getEmployeeCodeRules = async (): Promise<EmployeeCodeRules> => {
  const userSettings = await SettingsModel.findByGroup("users");

  const generationSetting = userSettings.find(
    (setting) => setting.key === "employee_code_generated_by",
  );

  const lengthSetting = userSettings.find(
    (setting) => setting.key === "employee_code_length",
  );

  const prefixSetting = userSettings.find(
    (setting) => setting.key === "employee_code_prefix",
  );

  if (!generationSetting) {
    throw new AppError(
      "Employee code generation setting is not configured",
      500,
    );
  }

  if (!lengthSetting) {
    throw new AppError(
      "Employee code length setting is not configured",
      500,
    );
  }

  if (!prefixSetting) {
    throw new AppError(
      "Employee code prefix setting is not configured",
      500,
    );
  }

  const generationType = String(generationSetting.value ?? "")
    .trim()
    .toLowerCase();

  if (
    generationType !== "auto" &&
    generationType !== "manual"
  ) {
    throw new AppError(
      "Employee code generation setting must be auto or manual",
      500,
    );
  }

  const requiredLength = Number(lengthSetting.value);

  if (
    !Number.isInteger(requiredLength) ||
    requiredLength <= 0
  ) {
    throw new AppError(
      "Employee code length setting must be a positive integer",
      500,
    );
  }

  const prefix = String(prefixSetting.value ?? "")
    .trim()
    .toUpperCase();

  if (!prefix) {
    throw new AppError(
      "Employee code prefix cannot be empty",
      500,
    );
  }

  if (generationType === "auto") {
    return {
      generationType: "auto",
      requiredLength,
      prefix,
    };
  }

  return {
    generationType: "manual",
    requiredLength,
    prefix,
  };
};

const buildManualEmployeeCode = (
  employeeCode: string | undefined,
  rules: ManualEmployeeCodeRules,
): string => {
  const numericCode = cleanString(employeeCode);

  if (!numericCode) {
    throw new AppError(
      "Employee code is required when manual generation is enabled",
      400,
    );
  }

  if (!/^\d+$/.test(numericCode)) {
    throw new AppError(
      "Employee code must contain numbers only",
      400,
    );
  }

  if (numericCode.length !== rules.requiredLength) {
    throw new AppError(
      `Employee code must contain exactly ${rules.requiredLength} digits`,
      400,
    );
  }

  return `${rules.prefix}${numericCode}`;
};

const autoEmpcodeGeneration = async (
  rules: AutoEmployeeCodeRules,
): Promise<string> => {
  const totalLength = rules.prefix.length + rules.requiredLength;

  for (
    let attempt = 1;
    attempt <= EMPLOYEE_CODE_MAXIMUM_ATTEMPTS;
    attempt += 1
  ) {
    const generatedEmployeeCode =
      await TeacherModel.generateEmployeeCode(
        rules.prefix,
        totalLength,
      );

    const alreadyExists = await TeacherModel.alreadyExists(
      "employee_code",
      generatedEmployeeCode,
    );

    if (!alreadyExists) {
      return generatedEmployeeCode;
    }
  }

  throw new AppError(
    "Unable to generate a unique employee code",
    500,
  );
};

const validateTeacherStatus = (
  status?: string,
): string | undefined => {
  const cleanedStatus = cleanString(status)?.toLowerCase();

  if (!cleanedStatus) {
    return undefined;
  }

  const allowedStatuses = [
    "active",
    "inactive",
    "resigned",
  ];

  if (!allowedStatuses.includes(cleanedStatus)) {
    throw new AppError(
      "Teacher status must be active, inactive, or resigned",
      400,
    );
  }

  return cleanedStatus;
};

const buildCreatePayload = (
  data: TeacherPayload,
  finalEmployeeCode: string,
): TeacherPayload => {
  const cleanedFirstName = cleanString(data.first_name);

  if (!cleanedFirstName) {
    throw new AppError("First name is required", 400);
  }

  const cleanedExperienceYears = cleanNumber(
    data.experience_years,
    "Experience years",
  );

  if (
    cleanedExperienceYears !== undefined &&
    cleanedExperienceYears < 0
  ) {
    throw new AppError(
      "Experience years cannot be negative",
      400,
    );
  }

  const cleanedBasicSalary = cleanNumber(
    data.basic_salary,
    "Basic salary",
  );

  if (
    cleanedBasicSalary !== undefined &&
    cleanedBasicSalary < 0
  ) {
    throw new AppError(
      "Basic salary cannot be negative",
      400,
    );
  }

  return {
    first_name: cleanedFirstName,
    last_name: cleanString(data.last_name),
    employee_code: finalEmployeeCode,
    email: cleanString(data.email)?.toLowerCase(),
    phone: cleanString(data.phone),
    alternate_phone: cleanString(data.alternate_phone),
    gender: cleanString(data.gender)?.toLowerCase(),
    date_of_birth: cleanString(data.date_of_birth),
    blood_group: cleanString(data.blood_group)?.toUpperCase(),
    marital_status: cleanString(data.marital_status)?.toLowerCase(),
    current_address: cleanString(data.current_address),
    permanent_address: cleanString(data.permanent_address),
    city: cleanString(data.city),
    state: cleanString(data.state),
    country: cleanString(data.country),
    pincode: cleanString(data.pincode),
    qualification: cleanString(data.qualification),
    specialization: cleanString(data.specialization),
    experience_years: cleanedExperienceYears,
    joining_date: cleanString(data.joining_date),
    employment_type: cleanString(data.employment_type)?.toLowerCase(),
    status: validateTeacherStatus(data.status) || "active",
    basic_salary: cleanedBasicSalary,
    bank_name: cleanString(data.bank_name),
    bank_account_number: cleanString(data.bank_account_number),
    ifsc_code: cleanString(data.ifsc_code)?.toUpperCase(),
    pan_number: cleanString(data.pan_number)?.toUpperCase(),
    emergency_contact_name: cleanString(data.emergency_contact_name),
    emergency_contact_phone: cleanString(data.emergency_contact_phone),
    emergency_contact_relation: cleanString(
      data.emergency_contact_relation,
    ),
    profile_image: cleanString(data.profile_image),
    remarks: cleanString(data.remarks),
  };
};

const buildUpdatePayload = (
  data: TeacherUpdatePayload,
  finalEmployeeCode?: string,
): TeacherUpdatePayload => {
  const cleanedExperienceYears = cleanNumber(
    data.experience_years,
    "Experience years",
  );

  if (
    cleanedExperienceYears !== undefined &&
    cleanedExperienceYears < 0
  ) {
    throw new AppError(
      "Experience years cannot be negative",
      400,
    );
  }

  const cleanedBasicSalary = cleanNumber(
    data.basic_salary,
    "Basic salary",
  );

  if (
    cleanedBasicSalary !== undefined &&
    cleanedBasicSalary < 0
  ) {
    throw new AppError(
      "Basic salary cannot be negative",
      400,
    );
  }

  return {
    first_name:
      data.first_name === undefined
        ? undefined
        : cleanString(data.first_name),

    last_name:
      data.last_name === undefined
        ? undefined
        : cleanString(data.last_name),

    employee_code: finalEmployeeCode,

    email:
      data.email === undefined
        ? undefined
        : cleanString(data.email)?.toLowerCase(),

    phone:
      data.phone === undefined
        ? undefined
        : cleanString(data.phone),

    alternate_phone:
      data.alternate_phone === undefined
        ? undefined
        : cleanString(data.alternate_phone),

    gender:
      data.gender === undefined
        ? undefined
        : cleanString(data.gender)?.toLowerCase(),

    date_of_birth:
      data.date_of_birth === undefined
        ? undefined
        : cleanString(data.date_of_birth),

    blood_group:
      data.blood_group === undefined
        ? undefined
        : cleanString(data.blood_group)?.toUpperCase(),

    marital_status:
      data.marital_status === undefined
        ? undefined
        : cleanString(data.marital_status)?.toLowerCase(),

    current_address:
      data.current_address === undefined
        ? undefined
        : cleanString(data.current_address),

    permanent_address:
      data.permanent_address === undefined
        ? undefined
        : cleanString(data.permanent_address),

    city:
      data.city === undefined
        ? undefined
        : cleanString(data.city),

    state:
      data.state === undefined
        ? undefined
        : cleanString(data.state),

    country:
      data.country === undefined
        ? undefined
        : cleanString(data.country),

    pincode:
      data.pincode === undefined
        ? undefined
        : cleanString(data.pincode),

    qualification:
      data.qualification === undefined
        ? undefined
        : cleanString(data.qualification),

    specialization:
      data.specialization === undefined
        ? undefined
        : cleanString(data.specialization),

    experience_years: cleanedExperienceYears,

    joining_date:
      data.joining_date === undefined
        ? undefined
        : cleanString(data.joining_date),

    employment_type:
      data.employment_type === undefined
        ? undefined
        : cleanString(data.employment_type)?.toLowerCase(),

    status:
      data.status === undefined
        ? undefined
        : validateTeacherStatus(data.status),

    basic_salary: cleanedBasicSalary,

    bank_name:
      data.bank_name === undefined
        ? undefined
        : cleanString(data.bank_name),

    bank_account_number:
      data.bank_account_number === undefined
        ? undefined
        : cleanString(data.bank_account_number),

    ifsc_code:
      data.ifsc_code === undefined
        ? undefined
        : cleanString(data.ifsc_code)?.toUpperCase(),

    pan_number:
      data.pan_number === undefined
        ? undefined
        : cleanString(data.pan_number)?.toUpperCase(),

    emergency_contact_name:
      data.emergency_contact_name === undefined
        ? undefined
        : cleanString(data.emergency_contact_name),

    emergency_contact_phone:
      data.emergency_contact_phone === undefined
        ? undefined
        : cleanString(data.emergency_contact_phone),

    emergency_contact_relation:
      data.emergency_contact_relation === undefined
        ? undefined
        : cleanString(data.emergency_contact_relation),

    profile_image:
      data.profile_image === undefined
        ? undefined
        : cleanString(data.profile_image),

    remarks:
      data.remarks === undefined
        ? undefined
        : cleanString(data.remarks),
  };
};

export class TeacherController {
  static findAll = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const statusParam = req.query.status;
      let status: TeacherStatusFilter = "all";

      if (
        typeof statusParam === "string" &&
        statusParam.trim() !== ""
      ) {
        const normalizedStatus = statusParam
          .trim()
          .toLowerCase();

        const allowedStatuses: TeacherStatusFilter[] = [
          "all",
          "active",
          "inactive",
          "resigned",
          "trash",
        ];

        if (
          !allowedStatuses.includes(
            normalizedStatus as TeacherStatusFilter,
          )
        ) {
          return next(
            new AppError(
              "Invalid teacher status filter",
              400,
            ),
          );
        }

        status = normalizedStatus as TeacherStatusFilter;
      }

      const teachers = await TeacherModel.findAll(status);

      return res.status(200).json({
        success: true,
        message: "Teachers fetched successfully",
        data: teachers,
      });
    },
  );

  static findById = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(
          new AppError("Invalid teacher ID", 400),
        );
      }

      const teacher = await TeacherModel.findById(id);

      if (!teacher) {
        return next(
          new AppError("Teacher not found", 404),
        );
      }

      return res.status(200).json({
        success: true,
        message: "Teacher fetched successfully",
        data: teacher,
      });
    },
  );

  static create = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const requestData = req.body as TeacherPayload;

      const employeeCodeRules = await getEmployeeCodeRules();
      let finalEmployeeCode: string;

      if (employeeCodeRules.generationType === "manual") {
        finalEmployeeCode = buildManualEmployeeCode(
          requestData.employee_code,
          employeeCodeRules,
        );

        const alreadyExists = await TeacherModel.alreadyExists(
          "employee_code",
          finalEmployeeCode,
        );

        if (alreadyExists) {
          return next(
            new AppError(
              "Employee code already exists",
              409,
            ),
          );
        }
      } else {
        finalEmployeeCode = await autoEmpcodeGeneration(
          employeeCodeRules,
        );
      }

      const createPayload = buildCreatePayload(
        requestData,
        finalEmployeeCode,
      );

      try {
        const teacher = await TeacherModel.create(createPayload);

        return res.status(201).json({
          success: true,
          message: "Teacher created successfully",
          data: teacher,
        });
      } catch (error) {
        const postgresError = error as PostgreSQLError;

        if (postgresError.code === "23505") {
          return next(
            new AppError(
              "A unique teacher value already exists",
              409,
            ),
          );
        }

        throw error;
      }
    },
  );

  static update = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.body.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(
          new AppError("Invalid teacher ID", 400),
        );
      }

      const existingTeacher = await TeacherModel.findById(id);

      if (!existingTeacher) {
        return next(
          new AppError("Teacher not found", 404),
        );
      }

      const requestData = req.body as TeacherUpdatePayload & {
        id: number;
      };

      let finalEmployeeCode: string | undefined;

      const employeeCodeWasProvided =
        Object.prototype.hasOwnProperty.call(
          req.body,
          "employee_code",
        );

      if (employeeCodeWasProvided) {
        const employeeCodeRules = await getEmployeeCodeRules();

        if (employeeCodeRules.generationType === "manual") {
          finalEmployeeCode = buildManualEmployeeCode(
            requestData.employee_code,
            employeeCodeRules,
          );
        } else {
          finalEmployeeCode = undefined;
        }
      }

      const updatePayload = buildUpdatePayload(
        requestData,
        finalEmployeeCode,
      );

      const hasAtLeastOneUpdate = Object.values(
        updatePayload,
      ).some((value) => value !== undefined);

      if (!hasAtLeastOneUpdate) {
        return next(
          new AppError(
            "At least one valid field is required to update teacher",
            400,
          ),
        );
      }

      try {
        const teacher = await TeacherModel.update(
          id,
          updatePayload,
        );

        if (!teacher) {
          return next(
            new AppError("Teacher not found", 404),
          );
        }

        return res.status(200).json({
          success: true,
          message: "Teacher updated successfully",
          data: teacher,
        });
      } catch (error) {
        const postgresError = error as PostgreSQLError;

        if (postgresError.code === "23505") {
          return next(
            new AppError(
              "A unique teacher value already exists",
              409,
            ),
          );
        }

        throw error;
      }
    },
  );

  static delete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(
          new AppError("Invalid teacher ID", 400),
        );
      }

      const teacher = await TeacherModel.delete(id);

      if (!teacher) {
        return next(
          new AppError("Teacher not found", 404),
        );
      }

      return res.status(200).json({
        success: true,
        message: "Teacher deleted successfully",
        data: teacher,
      });
    },
  );

  static restore = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(
          new AppError("Invalid teacher ID", 400),
        );
      }

      const teacher = await TeacherModel.restore(id);

      if (!teacher) {
        return next(
          new AppError("Teacher not found in trash", 404),
        );
      }

      return res.status(200).json({
        success: true,
        message: "Teacher restored successfully",
        data: teacher,
      });
    },
  );

  static permanentDelete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return next(
          new AppError("Invalid teacher ID", 400),
        );
      }

      const deleted = await TeacherModel.hardDelete(id);

      if (!deleted) {
        return next(
          new AppError("Teacher not found or already deleted", 404),
        );
      }

      return res.status(200).json({
        success: true,
        message: "Teacher permanently deleted successfully",
      });
    },
  );
}