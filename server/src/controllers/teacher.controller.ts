import { NextFunction, Request, Response } from "express";
import {
  TeacherModel,
  TeacherPayload,
  TeacherUpdatePayload,
} from "../models/teachers.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const cleanString = (value?: string): string | undefined => {
  if (typeof value !== "string") return undefined;

  const trimmedValue = value.trim();

  return trimmedValue || undefined;
};

const cleanNumber = (value?: number | string): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? undefined : numberValue;
};

export class TeacherController {
  static findAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const teachers = await TeacherModel.findAll();

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

      if (!id || Number.isNaN(id)) {
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

      if (!cleanString(first_name)) {
        return next(new AppError("First name is required", 400));
      }

      const teacher = await TeacherModel.create({
        first_name: cleanString(first_name) as string,
        last_name: cleanString(last_name),
        email: cleanString(email),
        phone: cleanString(phone),
        alternate_phone: cleanString(alternate_phone),

        gender: cleanString(gender),
        date_of_birth: cleanString(date_of_birth),
        blood_group: cleanString(blood_group),
        marital_status: cleanString(marital_status),

        current_address: cleanString(current_address),
        permanent_address: cleanString(permanent_address),
        city: cleanString(city),
        state: cleanString(state),
        country: cleanString(country),
        pincode: cleanString(pincode),

        qualification: cleanString(qualification),
        specialization: cleanString(specialization),
        experience_years: cleanNumber(experience_years),
        joining_date: cleanString(joining_date),
        employment_type: cleanString(employment_type),
        status: cleanString(status) || "active",

        basic_salary: cleanNumber(basic_salary),
        bank_name: cleanString(bank_name),
        bank_account_number: cleanString(bank_account_number),
        ifsc_code: cleanString(ifsc_code),
        pan_number: cleanString(pan_number),

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

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid teacher ID", 400));
      }

      const {
        first_name,
        last_name,
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
      } = req.body as TeacherUpdatePayload & { id: number };

      if (
        !first_name &&
        !last_name &&
        !email &&
        !phone &&
        !alternate_phone &&
        !gender &&
        !date_of_birth &&
        !blood_group &&
        !marital_status &&
        !current_address &&
        !permanent_address &&
        !city &&
        !state &&
        !country &&
        !pincode &&
        !qualification &&
        !specialization &&
        experience_years === undefined &&
        !joining_date &&
        !employment_type &&
        !status &&
        basic_salary === undefined &&
        !bank_name &&
        !bank_account_number &&
        !ifsc_code &&
        !pan_number &&
        !emergency_contact_name &&
        !emergency_contact_phone &&
        !emergency_contact_relation &&
        !profile_image &&
        !remarks
      ) {
        return next(
          new AppError("At least one field is required to update teacher", 400),
        );
      }

      const teacher = await TeacherModel.update(id, {
        first_name: cleanString(first_name),
        last_name: cleanString(last_name),
        email: cleanString(email),
        phone: cleanString(phone),
        alternate_phone: cleanString(alternate_phone),

        gender: cleanString(gender),
        date_of_birth: cleanString(date_of_birth),
        blood_group: cleanString(blood_group),
        marital_status: cleanString(marital_status),

        current_address: cleanString(current_address),
        permanent_address: cleanString(permanent_address),
        city: cleanString(city),
        state: cleanString(state),
        country: cleanString(country),
        pincode: cleanString(pincode),

        qualification: cleanString(qualification),
        specialization: cleanString(specialization),
        experience_years: cleanNumber(experience_years),
        joining_date: cleanString(joining_date),
        employment_type: cleanString(employment_type),
        status: cleanString(status),

        basic_salary: cleanNumber(basic_salary),
        bank_name: cleanString(bank_name),
        bank_account_number: cleanString(bank_account_number),
        ifsc_code: cleanString(ifsc_code),
        pan_number: cleanString(pan_number),

        emergency_contact_name: cleanString(emergency_contact_name),
        emergency_contact_phone: cleanString(emergency_contact_phone),
        emergency_contact_relation: cleanString(emergency_contact_relation),

        profile_image: cleanString(profile_image),
        remarks: cleanString(remarks),
      });

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

      if (!id || Number.isNaN(id)) {
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