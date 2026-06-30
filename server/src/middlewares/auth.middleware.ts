import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { UserModel } from "../models/user.model.js";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const isAuthenticated = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const token = req.cookies?.authtoken;

    if (!token) {
      return next(new AppError("Please login first", 401));
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new AppError("JWT secret is missing", 500));
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  },
);

type Role = "admin" | "teacher" | "student";

export const authorizeRoles = (...roles: Role[]) =>
  catchAsync(async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unable to get user", 401));
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(
        new AppError("Permission denied", 403),
      );
    }
    next();
  });
