import {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../utils/AppError.js";

interface PostgreSQLError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  schema?: string;
  column?: string;
}

const getDuplicateField = (
  error: PostgreSQLError,
): string | null => {
  const detailMatch = error.detail?.match(
    /Key \(([^)]+)\)=/,
  );

  if (detailMatch?.[1]) {
    return detailMatch[1];
  }

  const constraintFieldMap: Record<string, string> = {
    teachers_email_key: "email",
    teachers_employee_code_key: "employee_code",
    teachers_phone_key: "phone",
  };

  if (
    error.constraint &&
    constraintFieldMap[error.constraint]
  ) {
    return constraintFieldMap[error.constraint];
  }

  return null;
};

const formatFieldName = (field: string): string => {
  return field
    .split(",")
    .map((item) =>
      item
        .trim()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        ),
    )
    .join(", ");
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next(
    new AppError(
      `Route not found: ${req.originalUrl}`,
      404,
    ),
  );
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let status: "fail" | "error" = "error";
  let message = "Internal server error";
  let field: string | null = null;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    status = error.status;
    message = error.message;
  }

  const postgresError =
    error as PostgreSQLError;

  // PostgreSQL duplicate-key error
  if (postgresError.code === "23505") {
    statusCode = 409;
    status = "fail";

    field =
      getDuplicateField(postgresError);

    message = field
      ? `${formatFieldName(field)} already exists`
      : "Duplicate value already exists";
  }

  // PostgreSQL foreign-key error
  if (postgresError.code === "23503") {
    statusCode = 400;
    status = "fail";
    message =
      "Invalid related record reference";
  }

  // PostgreSQL not-null error
  if (postgresError.code === "23502") {
    statusCode = 400;
    status = "fail";

    field =
      postgresError.column ?? null;

    message = field
      ? `${formatFieldName(field)} is required`
      : "Required field is missing";
  }

  const isProduction =
    process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    status,
    message,

    ...(field ? { field } : {}),

    ...(isProduction
      ? {}
      : {
          errorName: error.name,
          stack: error.stack,
          details: error,
        }),
  });
};