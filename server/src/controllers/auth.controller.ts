import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { UserModel } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

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
      return next(new AppError("Email or password is required", 404));
    const user = await UserModel.findByEmail(email);
    if (!user) return next(new AppError("Wrong email or password", 409));
    const ispasswordMatch = await bcrypt.compare(password, user.password);
    if (!ispasswordMatch) return next(new AppError("Wrong email or password", 404));
    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      "7d") as SignOptions["expiresIn"];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn,
      },
    );
    res.cookie("authtoken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Logged in successfully",
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  },
);
