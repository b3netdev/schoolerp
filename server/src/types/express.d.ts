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
      userId?: number;
      user?: AuthenticatedUser;
      student?: AuthenticatedStudent;
    }
  }
}

export { };