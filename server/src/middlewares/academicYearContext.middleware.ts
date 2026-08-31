import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { runWithAcademicYear } from "../context/academic-year-context.js";


export const withAcademicYearContext = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new AppError("Unable to get user", 401));
    return;
  }

  const academicYearId = req.user.academic_year_id;

  if (
    academicYearId === undefined ||
    academicYearId === null
  ) {
    next(
      new AppError(
        "No academic year is set on this session. Please switch to an academic year and log in again.",
        400,
      ),
    );
    return;
  }

  runWithAcademicYear(academicYearId, next);
};
