import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { TeacherModel } from "../models/teachers.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export type TeacherRequest = Request & {
  teacher?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    profile_image: string | null;
    role: "teacher";
  };
};

type TeacherTokenPayload = JwtPayload & {
  id: number;
  role: "teacher";
  token_type: "teacher";
};

export const isTeacherAuthenticated = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.teacher_authtoken;

    if (!token) {
      return next(new AppError("Please log in as a teacher first.", 401));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new AppError("Server authentication configuration error.", 500));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as TeacherTokenPayload;

      if (
        decoded.token_type !== "teacher" ||
        decoded.role !== "teacher" ||
        !Number.isInteger(decoded.id) ||
        decoded.id <= 0
      ) {
        return next(new AppError("Invalid teacher authentication token.", 401));
      }

      const teacher = await TeacherModel.findById(decoded.id);

      if (!teacher || teacher.status !== "active") {
        return next(new AppError("Teacher account is unavailable.", 401));
      }

      (req as TeacherRequest).teacher = {
        id: teacher.id,
        employee_code: teacher.employee_code,
        first_name: teacher.first_name,
        last_name: teacher.last_name ?? null,
        email: teacher.email ?? null,
        profile_image: teacher.profile_image ?? null,
        role: "teacher",
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError("Your teacher session has expired. Please log in again.", 401));
      }

      return next(new AppError("Invalid teacher authentication token.", 401));
    }
  },
);
