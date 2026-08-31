import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload as JsonWebTokenPayload } from "jsonwebtoken";

import { TeacherModel } from "../models/teachers.model.js";
import { UserModel } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type Role = "admin" | "teacher" | "student";

interface AuthTokenPayload extends JsonWebTokenPayload {
  id: string | number;
  email?: string;
  role: Role;
  default_academic_session?: unknown;
  academic_year_id?: number;
}

const getAcademicSessionName = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "name" in value &&
    typeof (value as { name?: unknown }).name === "string"
  ) {
    return (value as { name: string }).name;
  }

  return "";
};

export const isAuthenticated = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.authtoken;

    if (!token) {
      return next(new AppError("Please login first", 401));
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new AppError("Server authentication configuration error", 500));
    }

    let decoded: AuthTokenPayload;

    try {
      const verified = jwt.verify(token, jwtSecret);

      if (!verified || typeof verified !== "object") {
        return next(new AppError("Invalid authentication token", 401));
      }

      decoded = verified as AuthTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(
          new AppError("Your session has expired. Please login again.", 401),
        );
      }

      return next(
        new AppError("Invalid authentication token. Please login again.", 401),
      );
    }

    const accountId = Number(decoded.id);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return next(
        new AppError("Invalid user information in authentication token", 401),
      );
    }

    if (decoded.role === "admin") {
      const user = await UserModel.findById(accountId);

      if (!user) {
        return next(new AppError("User no longer exists", 401));
      }

      if (!user.is_active) {
        return next(new AppError("User is not active", 403));
      }

      if (user.role !== decoded.role) {
        return next(
          new AppError("User role has changed. Please login again.", 403),
        );
      }

      req.userId = user.id;
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        default_academic_session: getAcademicSessionName(
          decoded.default_academic_session,
        ),
        academic_year_id: Number(decoded.academic_year_id ?? 0),
      };

      return next();
    }

    if (decoded.role === "teacher") {
      const teacher = await TeacherModel.findById(accountId);

      if (!teacher) {
        return next(new AppError("Teacher no longer exists", 401));
      }

      if (teacher.status !== "active") {
        return next(new AppError("Teacher account is not active", 403));
      }

      req.userId = teacher.id;
      req.user = {
        id: teacher.id,
        name: [teacher.first_name, teacher.last_name].filter(Boolean).join(" "),
        email: teacher.email ?? "",
        role: "teacher",
        default_academic_session: getAcademicSessionName(
          decoded.default_academic_session,
        ),
        academic_year_id: Number(decoded.academic_year_id ?? 0),
      };

      return next();
    }

    return next(new AppError("Unsupported user role", 403));
  },
);

export const authorizeRoles = (...roles: Role[]) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unable to get authenticated user", 401));
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(new AppError("Permission denied", 403));
    }

    next();
  });
