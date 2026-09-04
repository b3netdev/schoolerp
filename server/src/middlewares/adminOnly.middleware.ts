import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";


export const adminOnly = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
 
  if (!req.user || !req.userId) {
    return next(
      new AppError("Please log in to continue.", 401),
    );
  }

  if (req.user.role?.toLowerCase() !== "admin") {
    return next(
      new AppError(
        "Only admins are allowed to post or manage notices.",
        403,
      ),
    );
  }
  next();
};