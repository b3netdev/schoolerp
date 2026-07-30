import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import styles from "../admin/AdminSignin.module.css";
import useStudentAuth from "@/hooks/useStudentAuth";

const StudentSignin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { studentLogin, loading } = useStudentAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = await studentLogin({ identifier, password });

    if (data) {
      navigate("/student-portal/dashboard");
    }
  };

  return (
    <section className={styles.signinPage}>
      <div className={styles.overlay}></div>

      <div className={styles.signinWrapper}>
        <div className={styles.leftContent}>
          <span className={styles.badge}>Student Portal</span>

          <h1>
            Welcome Back to <br />
            {import.meta.env.VITE_SCHOOL_NAME || "BrightPath Academy"}
          </h1>

          <p>
            Sign in with your student code, phone number, or email to view
            your classes, attendance, and results.
          </p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Student Sign In</h2>
            <p>Enter your student code, phone, or email, and your password.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier">Student Code / Phone / Email</label>

              <Input
                id="identifier"
                type="text"
                placeholder="e.g. STU000123"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className={styles.inputField}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>

              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.inputField}
              />
            </div>

            <button type="submit" className={styles.signinBtn} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default StudentSignin;
