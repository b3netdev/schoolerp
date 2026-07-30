import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import useStudentAuth from "@/hooks/useStudentAuth";
import LoadingPage from "@/components/common/Loading";

/**
 * Self-contained guard: the student portal uses its own cookies
 * (student_authtoken / student_refreshtoken) and its own redux slice
 * (studentAuth), entirely separate from the admin/teacher `auth` slice and
 * the shared `/:portal` + ProtectedRoute system. This page checks its own
 * session directly rather than relying on that shared machinery.
 */
export default function StudentDashboard() {
  const { checkAuth } = useStudentAuth();
  const student = useAppSelector((state) => state.studentAuth.student);
  const isAuthenticated = useAppSelector(
    (state) => state.studentAuth.isAuthenticated,
  );
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!isAuthenticated) {
        await checkAuth();
      }
      setChecking(false);
    };

    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return <LoadingPage />;
  }

  if (!isAuthenticated || !student) {
    return <Navigate to="/student-portal/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {student.first_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Student Code: {student.student_code}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Email
            </p>
            <p className="mt-1 text-sm text-foreground">
              {student.email || "Not provided"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Phone
            </p>
            <p className="mt-1 text-sm text-foreground">
              {student.phone || "Not provided"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
