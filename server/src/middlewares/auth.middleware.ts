import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt, {
  JwtPayload as JsonWebTokenPayload,
} from "jsonwebtoken";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { UserModel } from "../models/user.model.js";

interface AuthTokenPayload extends JsonWebTokenPayload {
  id: string | number;
  email: string;
  role: string;
  default_academic_session: string;
  academic_year_id: number;
}

export const isAuthenticated = catchAsync(
  async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {

    const token = req.cookies?.authtoken;

    if (!token) {
      return next(
        new AppError(
          "Please login first",
          401,
        ),
      );
    }


    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is missing from environment variables",
      );

      return next(
        new AppError(
          "Server authentication configuration error",
          500,
        ),
      );
    }


    let decoded: AuthTokenPayload;

    try {
      const verified = jwt.verify(
        token,
        jwtSecret,
      );

      if (
        typeof verified !==
        "object"
      ) {
        return next(
          new AppError(
            "Invalid authentication token",
            401,
          ),
        );
      }

      decoded =
        verified as AuthTokenPayload;
    } catch (error) {
      console.error(
        "JWT verification failed:",
        error,
      );

      if (
        error instanceof
        jwt.TokenExpiredError
      ) {
        return next(
          new AppError(
            "Your session has expired. Please login again.",
            401,
          ),
        );
      }

      return next(
        new AppError(
          "Invalid authentication token. Please login again.",
          401,
        ),
      );
    }

    /**
     * 4. Validate user ID
     */
    const userId = Number(
      decoded.id,
    );

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return next(
        new AppError(
          "Invalid user information in authentication token",
          401,
        ),
      );
    }

    /**
     * 5. Get current user from DB
     */
    const user =
      await UserModel.findById(
        userId,
      );

    if (!user) {
      return next(
        new AppError(
          "User no longer exists",
          401,
        ),
      );
    }

    /**
     * 6. Make sure user is active
     */
    if (!user.is_active) {
      return next(
        new AppError(
          "User is not active",
          403,
        ),
      );
    }

    /**
     * 7. Make sure role wasn't changed
     */
    if (
      user.role !==
      decoded.role
    ) {
      return next(
        new AppError(
          "User role has changed. Please login again.",
          403,
        ),
      );
    }


    req.userId =
      Number(user.id);


    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,

      default_academic_session:
        decoded.default_academic_session,
      academic_year_id:
        decoded.academic_year_id,
    };

    next();
  },
);

type Role =
  | "admin"
  | "teacher"
  | "student";

export const authorizeRoles = (
  ...roles: Role[]
) =>
  catchAsync(
    async (
      req: Request,
      _res: Response,
      next: NextFunction,
    ) => {
      if (!req.user) {
        return next(
          new AppError(
            "Unable to get authenticated user",
            401,
          ),
        );
      }

      if (
        !roles.includes(
          req.user.role as Role,
        )
      ) {
        return next(
          new AppError(
            "Permission denied",
            403,
          ),
        );
      }

      next();
    },
  );