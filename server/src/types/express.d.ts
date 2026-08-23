import "express";

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: number;
      name: string;
      email: string;
      role: string;
      default_academic_session: string;

      /**
       * Trusted current academic year,
       * sourced only from the verified JWT.
       */
      academic_year_id: number;
    }

    interface AuthenticatedStudent {
      id: number;
      student_code: string;
      first_name: string;
      last_name?: string | null;
      email?: string | null;
      phone?: string | null;
    }

    interface Request {
      /**
       * Simple authenticated user ID.
       * Set by isAuthenticated middleware.
       */
      userId?: number;

      /**
       * Full authenticated admin/teacher/user.
       */
      user?: AuthenticatedUser;

      /**
       * Authenticated student.
       */
      student?: AuthenticatedStudent;
    }
  }
}

export { };