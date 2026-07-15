// Helper functions helper.ts
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";
import { TeacherModel, TeacherPayload, TeacherUpdatePayload } from "../models/teachers.model.js";

const alreadyExistsBy = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { field, value, label, at } = req.body;


  

    if(at === undefined || at === null || at === "") {
      return next(new AppError("The 'at' field is required.", 400));
    }else if (typeof at !== "string") {
      return next(new AppError("The 'at' field must be a string.", 400));
    }else{
      const normalizedAt = at.trim().toLowerCase();
      switch (normalizedAt) {
        case "teacher":
          var selectedModel = TeacherModel;
          break;
        default:
          return next(new AppError(`Invalid model: ${at}`, 400));
      }
      
    }

    if (!selectedModel) {
      return next(new AppError(`Invalid model: ${at}`, 400));
    }

    const exists = await selectedModel.alreadyExists(field, value);

    if (exists) {
      return next(
        new AppError(
          `${label} already exists.`,
          400
        )
      );
    }

    return res.status(200).json({
       success: true,
        message: "valid",
    });
  }
);

export { alreadyExistsBy };