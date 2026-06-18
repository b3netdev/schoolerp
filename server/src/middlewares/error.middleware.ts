import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let status: "fail" | "error" = "error";
  let message = "Internal server error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    status = error.status;
    message = error.message;
  }

  // PostgreSQL duplicate key error
  if ((error as any).code === "23505") {
    statusCode = 409;
    status = "fail";
    message = "Duplicate value already exists";
  }

  // PostgreSQL foreign key error
  if ((error as any).code === "23503") {
    statusCode = 400;
    status = "fail";
    message = "Invalid related record reference";
  }

  // PostgreSQL not-null error
  if ((error as any).code === "23502") {
    statusCode = 400;
    status = "fail";
    message = "Required field is missing";
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    status,
    message,
    ...(isProduction
      ? {}
      : {
          errorName: error.name,
          stack: error.stack,
          details: error,
        }),
  });
};