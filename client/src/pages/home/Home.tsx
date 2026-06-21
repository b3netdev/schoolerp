import schoolbg from "../../assets/images/home-bg.jpg";
import schoolLogo from "../../assets/images/school_logo.png";
import styles from "./home.module.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate()

  const HandleSignIn = (role: string) => {
    if (role == "admin") {
      navigate("/admin/signin")
    }
  }


  return (
    <div
      className={styles.homeContainer}
      style={{ backgroundImage: `url(${schoolbg})` }}
    >
      <div className={styles.overlay}></div>

      <div className={styles.homeContent}>
        <div className={styles.heroCard}>
          <div className={styles.logoBox}>
            <img src={schoolLogo} alt="School Logo" />
          </div>

          <p className={styles.welcomeText}>Welcome to</p>

          <h1>{import.meta.env.VITE_SCHOOL_NAME}</h1>

          <h2>A clear path for potential</h2>

          <p className={styles.description}>
            Manage school operations, academic records, attendance, routines, notices, and user access from one secure admin panel.
          </p>

          <div className={styles.loginSection}>
            <p className={styles.loginTitle}>Continue to your portal</p>

            <div className={styles.loginButtons}>
              <button className={styles.studentBtn}
                onClick={() => HandleSignIn("student")}
              >
                Login as Student
              </button>

              <button className={styles.teacherBtn}
                onClick={() => HandleSignIn("teacher")}
              >
                Login as Teacher
              </button>

              <button className={styles.adminBtn}
                onClick={() => HandleSignIn("admin")}
              >
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;