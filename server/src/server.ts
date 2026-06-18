import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import { corsOptions } from "./utils/cors.js";
import { testConnection } from "./config/database.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

testConnection()

app.use(cors(corsOptions));


app.use(express.json());




app.get("/", (req: Request, res: Response) => {
  res.send("School Management Server is running");
});


app.use(errorHandler)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT}`);
});