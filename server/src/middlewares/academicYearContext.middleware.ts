import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { runWithAcademicYear } from "../context/academic-year-context.js";

/**
 * Must run after `isAuthenticated` (needs req.user). Establishes the
 * AsyncLocalStorage store for the rest of this request's lifetime so every
 * db.table() call — in this handler or any model/service it calls — can
 * see the trusted academic year without it being passed explicitly.
 *
 * Because this uses AsyncLocalStorage.run() per request, concurrent
 * requests each get their own isolated store; they cannot see or overwrite
 * each other's academic_year_id even while their async work interleaves.
 */
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
