import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import { corsOptions } from "./utils/cors.js";
import { dbConnection } from "./config/database.js";
import { errorHandler } from "./middlewares/error.middleware.js";
// import routers 
import AuthRouter from "./routes/auth.route.js";
import settingsRoutes from "./routes/settings.route.js"
import SectionRouter from "./routes/section.route.js"
import ClassRouter from "./routes/classes.route.js"
import TeachersRouter from "./routes/teachers.route.js"

import cookieParser from "cookie-parser";
const app = express();
dbConnection();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("School Management Server is running");
});


// Routers
app.use(`/${process.env.API_VERSION}/auth`, AuthRouter);
app.use(`/${process.env.API_VERSION}/settings`, settingsRoutes);
app.use(`/${process.env.API_VERSION}/section`, SectionRouter);
app.use(`/${process.env.API_VERSION}/class`, ClassRouter);
app.use(`/${process.env.API_VERSION}/teacher`, TeachersRouter);


app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT}`);
});
