import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import styles from "./AdminSignin.module.css";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth"

const AdminSignin = () => {
  const [email, setEmail] = useState("tuhin@gmail.com");
  const [password, setPassword] = useState("Tuhin1234");
  const navigate = useNavigate()
  const { adminLogin, loading, error } = useAuth()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      email,
      password
    }
    const data: any = await adminLogin(payload)
    console.log(data)
    if (data) {
      navigate(`/${data.role}/dashboard`);
    }


  };

  return (
    <section className={styles.signinPage}>
      <div className={styles.overlay}></div>

      <div className={styles.signinWrapper}>
        <div className={styles.leftContent}>
          <span className={styles.badge}>Admin Portal</span>

          <h1>
            Welcome Back to <br />
            {import.meta.env.VITE_SCHOOL_NAME || "BrightPath Academy"}
          </h1>

          <p>
            Manage students, teachers, attendance, routines, exams, notices, and
            school administration from one secure panel.
          </p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Admin Sign In</h2>
            <p>Enter your email and password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>

              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div className={styles.formOptions}>
              <label className={styles.rememberMe}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button type="button" className={styles.forgotBtn}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className={styles.signinBtn}>
              {
                loading ? "Loading" : "Sign IN"
              }
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminSignin;