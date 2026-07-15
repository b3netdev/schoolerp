// Helper functions helper.ts
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";
import { TeacherModel, TeacherPayload, TeacherUpdatePayload } from "../models/teachers.model.js";

const alreadyExistsError = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { field, value, label, model } = req.body;

    const modelMap = {
      teacher: TeacherModel,
      // student: StudentModel,
      // parent: ParentModel,
    } as const;

    const selectedModel = modelMap[model as keyof typeof modelMap];

    if (!selectedModel) {
      return next(new AppError(`Invalid model: ${model}`, 400));
    }

    const exists = await selectedModel.alreadyExists(field, value);

    if (exists) {
      return next(
        new AppError(
          `${label || model} with ${field} '${value}' already exists.`,
          400
        )
      );
    }

    next();
  }
);