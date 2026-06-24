import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import { corsOptions } from "./utils/cors.js";
import { dbConnection } from "./config/database.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import UserRouter from "./routes/user.route.js";
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

app.use(`/${process.env.API_VERSION}/user`,UserRouter);


app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT}`);
});
