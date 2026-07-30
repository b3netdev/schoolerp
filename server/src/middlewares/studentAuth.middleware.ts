import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { StudentModel } from "../models/student.model.js";

export interface StudentAccessTokenPayload {
  id: number;
  student_code: string;
  role: "student";
}

export const STUDENT_ACCESS_TOKEN_COOKIE = "student_authtoken";
export const STUDENT_REFRESH_TOKEN_COOKIE = "student_refreshtoken";

export const isStudentAuthenticated = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[STUDENT_ACCESS_TOKEN_COOKIE];

    if (!token) {
      return next(new AppError("Please login first", 401));
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new AppError("JWT secret is missing", 500));
    }

    let decoded: StudentAccessTokenPayload;

    try {
      decoded = jwt.verify(token, jwtSecret) as StudentAccessTokenPayload;
    } catch {
      return next(new AppError("Session expired, please login again", 401));
    }

    if (decoded.role !== "student") {
      return next(new AppError("Invalid session", 401));
    }

    const student = await StudentModel.findById(decoded.id);

    if (!student) {
      return next(new AppError("Student no longer exists", 401));
    }

    if (!student.is_active || student.status !== "active") {
      return next(new AppError("Student account is not active", 403));
    }

    req.student = {
      id: student.id,
      student_code: student.student_code,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
    };

    next();
  },
);
