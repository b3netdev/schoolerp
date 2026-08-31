import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { UserModel } from "../models/user.model.js";
import { AcademicSessionModel } from "../models/AcademicSession.model.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { TeacherModel } from "../models/teachers.model.js";

export const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body;
    let role = "admin";

    const userExists = await UserModel.findByEmail(email);
    if (userExists) {
      return next(new AppError("Provided email already exixts", 409));
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(200).json({
      success: true,
      user,
      message: "New admin created",
    });
  },
);

export const adminLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError("Email or password is required", 400));
    const DefaultAcademicSession = await AcademicSessionModel.getDefaultSession();
    //console.log("DefaultAcademicSession", DefaultAcademicSession);
    if (!DefaultAcademicSession) {
      return next(new AppError("No default academic session is configured", 500));
    }
    const user = await UserModel.findByEmail(email);
    if (!user) return next(new AppError("Wrong email or password", 401));
    const ispasswordMatch = await bcrypt.compare(password, user.password);
    if (!ispasswordMatch)
      return next(new AppError("Wrong email or password", 401));
    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      "7d") as SignOptions["expiresIn"];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        default_academic_session: DefaultAcademicSession,
        academic_year_id: DefaultAcademicSession.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn,
      },
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("authtoken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "Logged in successfully",
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        default_academic_session: DefaultAcademicSession,
        academic_year_id: DefaultAcademicSession.id,
      },
    });
  },
);

export const switchAcademicSession = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unable to get user", 401));
    }

    const academicSessionId = Number(req.body.academic_session_id);
    if (!academicSessionId || Number.isNaN(academicSessionId)) {
      return next(new AppError("academic_session_id is required", 400));
    }

    const session = await AcademicSessionModel.findById(academicSessionId);
    if (!session) {
      return next(new AppError("Academic session not found", 404));
    }
    if (session.status !== "active") {
      return next(new AppError("Cannot switch to an inactive academic session", 400));
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      "7d") as SignOptions["expiresIn"];

    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        default_academic_session: session,
        academic_year_id: session.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn,
      },
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("authtoken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Academic session switched successfully",
      data: {
        academic_year_id: session.id,
        academic_session: session,
      },
    });
  },
);

export const signOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === "production";
    
    res.clearCookie("authtoken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/",
    });
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
);

export const updateProfile = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unable to get user", 401));
    }
    const { name, email } = req.body;
    if (!name || !email) {
      return next(new AppError("Name and email are required", 400));
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return next(new AppError("Email is already in use", 409));
    }

    const updatedUser = await UserModel.updateProfile(req.user.id, {
      name,
      email,
    });
    if (!updatedUser) return next(new AppError("User not found", 404));

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  },
);

export const changePassword = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unable to get user", 401));
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(
        new AppError("Current and new password are required", 400),
      );
    }
    if (newPassword.length < 6) {
      return next(
        new AppError("New password must be at least 6 characters", 400),
      );
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return next(new AppError("User not found", 404));

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, hashedPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  },
);


export const checkAuth = catchAsync(
  async (
    req: any,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return next(
        new AppError("Unable to get authenticated user", 401),
      );
    }

    if (req.user.role === "admin") {
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return next(
          new AppError("User not found", 401),
        );
      }

      return res.status(200).json({
        success: true,
        message: "Authenticated admin fetched successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          academic_year_id: req.user.academic_year_id,
          default_academic_session:
            req.user.default_academic_session,
        },
      });
    }

    if (req.user.role === "teacher") {
      const teacher = await TeacherModel.findById(req.user.id);

      if (!teacher || teacher.status !== "active") {
        return next(
          new AppError("Teacher not found or inactive", 401),
        );
      }

      return res.status(200).json({
        success: true,
        message: "Authenticated teacher fetched successfully",
        data: {
          id: teacher.id,
          employee_code: teacher.employee_code,
          name: [
            teacher.first_name,
            teacher.last_name,
          ]
            .filter(Boolean)
            .join(" "),
          email: teacher.email,
          profile_image: teacher.profile_image,
          role: "teacher",
          academic_year_id: req.user.academic_year_id,
          default_academic_session:
            req.user.default_academic_session,
        },
      });
    }

    return next(
      new AppError("Unsupported user role", 403),
    );
  },
);

