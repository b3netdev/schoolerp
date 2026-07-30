import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { StudentModel } from "../models/student.model.js";
import { StudentRefreshTokenModel } from "../models/student-refresh-token.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  STUDENT_ACCESS_TOKEN_COOKIE,
  STUDENT_REFRESH_TOKEN_COOKIE,
  StudentAccessTokenPayload,
} from "../middlewares/studentAuth.middleware.js";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const isProduction = () => process.env.NODE_ENV === "production";

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: (isProduction() ? "strict" : "lax") as "strict" | "lax",
  maxAge,
  path: "/",
});

const signAccessToken = (studentId: number, studentCode: string): string => {
  const payload: StudentAccessTokenPayload = {
    id: studentId,
    student_code: studentCode,
    role: "student",
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

const setAuthCookies = async (
  res: Response,
  studentId: number,
  studentCode: string,
) => {
  const accessToken = signAccessToken(studentId, studentCode);
  const { token: refreshToken } = await StudentRefreshTokenModel.issue(
    studentId,
  );

  res.cookie(
    STUDENT_ACCESS_TOKEN_COOKIE,
    accessToken,
    cookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS),
  );

  res.cookie(
    STUDENT_REFRESH_TOKEN_COOKIE,
    refreshToken,
    cookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
  );
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(STUDENT_ACCESS_TOKEN_COOKIE, { path: "/" });
  res.clearCookie(STUDENT_REFRESH_TOKEN_COOKIE, { path: "/" });
};

/**
 * Login with student_code, phone, or email — whichever the student enters —
 * plus password. The frontend exposes this as a single "identifier" field.
 */
export const studentLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const identifier = String(req.body.identifier ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!identifier || !password) {
      return next(
        new AppError("Student code / phone / email and password are required", 400),
      );
    }

    const student = await StudentModel.findByLoginIdentifier(identifier);

    if (!student) {
      return next(new AppError("Invalid credentials", 401));
    }

    if (!student.is_active || student.status !== "active") {
      return next(new AppError("Student account is not active", 403));
    }

    const passwordMatches = await bcrypt.compare(password, student.password);

    if (!passwordMatches) {
      return next(new AppError("Invalid credentials", 401));
    }

    await setAuthCookies(res, student.id, student.student_code);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        id: student.id,
        student_code: student.student_code,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone,
      },
    });
  },
);

/**
 * Rotates the refresh token and issues a fresh access token. The frontend
 * calls this when an API request comes back 401 with an expired access token.
 */
export const studentRefresh = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies?.[STUDENT_REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      return next(new AppError("Please login again", 401));
    }

    const studentId = await StudentRefreshTokenModel.findValidStudentId(
      refreshToken,
    );

    if (!studentId) {
      clearAuthCookies(res);
      return next(new AppError("Session expired, please login again", 401));
    }

    const student = await StudentModel.findById(studentId);

    if (!student || !student.is_active || student.status !== "active") {
      clearAuthCookies(res);
      return next(new AppError("Session expired, please login again", 401));
    }

    // Rotation: the old refresh token is revoked and replaced, so a stolen,
    // already-used token cannot be replayed after the legitimate client refreshes.
    const accessToken = signAccessToken(student.id, student.student_code);
    const { token: newRefreshToken } = await StudentRefreshTokenModel.rotate(
      refreshToken,
      student.id,
    );

    res.cookie(
      STUDENT_ACCESS_TOKEN_COOKIE,
      accessToken,
      cookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS),
    );

    res.cookie(
      STUDENT_REFRESH_TOKEN_COOKIE,
      newRefreshToken,
      cookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
    );

    res.status(200).json({
      success: true,
      message: "Session refreshed",
    });
  },
);

export const studentLogout = catchAsync(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[STUDENT_REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await StudentRefreshTokenModel.revoke(refreshToken);
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
);

export const studentCheckAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.student) {
      return next(new AppError("Unable to get student", 401));
    }

    res.status(200).json({
      success: true,
      message: "Get student",
      data: req.student,
    });
  },
);
