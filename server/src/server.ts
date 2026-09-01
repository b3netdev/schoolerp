import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express, { Request, Response } from "express";
import cors from "cors";
import { corsOptions } from "./utils/cors.js";
import { dbConnection } from "./config/database.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { initAcademicYearTableRegistry } from "./db/academic-year-registry.js";
// import routers
import AuthRouter from "./routes/auth.route.js";
import AcademicSessionRouter from "./routes/academic-session.route.js";
import settingsRoutes from "./routes/settings.route.js";
import SectionRouter from "./routes/section.route.js";
import ClassRouter from "./routes/classes.route.js";
import ProfileRouter from "./routes/profile.route.js";
import TeachersRouter from "./routes/teachers.route.js";
import ClassSectionRelationRouter from "./routes/classs-section-relation.route.js";
import StreamRouter from "./routes/stream.route.js";
import AlreadyExisteBy from "./routes/helper.route.js";
import StudentRouter from "./routes/student.route.js";
import StudentClassRelationRouter from "./routes/student-class-relation.route.js";
import StudentAuthRouter from "./routes/student-auth.route.js";
import SubjectRouter from "./routes/subject.route.js";
import StudentAttendenceRouter from "./routes/studentAttendance.route.js";
import ExamRouter from "./routes/exam.route.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("School Management Server is running");
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routers
app.use(`/${process.env.API_VERSION}/auth`, AuthRouter);
app.use(`/${process.env.API_VERSION}/academic-session`, AcademicSessionRouter);
app.use(`/${process.env.API_VERSION}/settings`, settingsRoutes);
app.use(`/${process.env.API_VERSION}/section`, SectionRouter);
app.use(`/${process.env.API_VERSION}/class`, ClassRouter);
app.use(`/${process.env.API_VERSION}/teacher`, TeachersRouter);
app.use(
  `/${process.env.API_VERSION}/class-section`,
  ClassSectionRelationRouter,
);
app.use(`/${process.env.API_VERSION}/stream`, StreamRouter);
app.use(`/${process.env.API_VERSION}/check-exists`, AlreadyExisteBy);
app.use(`/${process.env.API_VERSION}/student`, StudentRouter);
app.use(
  `/${process.env.API_VERSION}/student-class-relation`,
  StudentClassRelationRouter,
);
app.use(`/${process.env.API_VERSION}/student-auth`, StudentAuthRouter);
app.use(`/${process.env.API_VERSION}/subjects`, SubjectRouter);
app.use(
  `/${process.env.API_VERSION}/student-attendence`,
  StudentAttendenceRouter,
);
app.use(`/${process.env.API_VERSION}/profile`, ProfileRouter);
app.use(`/${process.env.API_VERSION}/exam`, ExamRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  const connected = await dbConnection();

  if (!connected) {
    console.error("Refusing to start: database connection failed");
    process.exit(1);
  }

  // Populated once, cached in-process, never queried per-request.
  // Use refreshAcademicYearTableRegistry() after a migration adds/removes
  // an academic_year_id column on a live process, instead of restarting.
  await initAcademicYearTableRegistry();

  app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
