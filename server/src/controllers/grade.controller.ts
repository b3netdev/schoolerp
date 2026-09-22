import { Request, Response, NextFunction } from "express";
import { GradeModel, CreateGradePayload } from "../models/Grade.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const validateGradePayload = (data: CreateGradePayload) => {
  const { grade, range_from, range_to } = data;

  if (!grade || !grade.trim()) {
    throw new AppError("Grade is required.", 400);
  }

  if (
    range_from !== undefined &&
    range_from !== null &&
    !Number.isInteger(Number(range_from))
  ) {
    throw new AppError("Range from must be a whole number.", 400);
  }

  if (
    range_to !== undefined &&
    range_to !== null &&
    !Number.isInteger(Number(range_to))
  ) {
    throw new AppError("Range to must be a whole number.", 400);
  }

  if (
    range_from !== undefined &&
    range_to !== undefined &&
    range_from !== null &&
    range_to !== null &&
    Number(range_from) > Number(range_to)
  ) {
    throw new AppError(
      "Range from cannot be greater than range to.",
      400
    );
  }
};

export const getGrades = catchAsync(
  async (_req: Request, res: Response) => {
    const grades = await GradeModel.findAll();

    res.status(200).json({
      success: true,
      message: "Grades fetched successfully.",
      data: grades,
    });
  }
);

export const getGradeById = catchAsync(
  async (req: Request, res: Response) => {
    const grade = await GradeModel.findById(Number(req.params.id));

    if (!grade) {
      throw new AppError("Grade not found.", 404);
    }

    res.status(200).json({
      success: true,
      data: grade,
    });
  }
);

export const addGrade = catchAsync(
  async (req: Request, res: Response) => {
    const payload: CreateGradePayload = req.body;

    validateGradePayload(payload);

    const existingGrade = await GradeModel.findByGradeName(payload.grade);

    if (existingGrade) {
      throw new AppError("This grade already exists.", 409);
    }

    const grade = await GradeModel.create({
      ...payload,
      range_from:
        payload.range_from !== undefined
          ? Number(payload.range_from)
          : null,
      range_to:
        payload.range_to !== undefined ? Number(payload.range_to) : null,
    });

    res.status(201).json({
      success: true,
      message: "Grade added successfully.",
      data: grade,
    });
  }
);

export const updateGrade = catchAsync(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const payload: CreateGradePayload = req.body;

    const currentGrade = await GradeModel.findById(id);

    if (!currentGrade) {
      throw new AppError("Grade not found.", 404);
    }

    const mergedPayload = {
      grade: payload.grade ?? currentGrade.grade,
      range_from: payload.range_from ?? currentGrade.range_from,
      range_to: payload.range_to ?? currentGrade.range_to,
      remarks: payload.remarks ?? currentGrade.remarks,
      description: payload.description ?? currentGrade.description,
    };

    validateGradePayload(mergedPayload);

    if (payload.grade) {
      const existingGrade = await GradeModel.findByGradeName(
        payload.grade,
        id
      );

      if (existingGrade) {
        throw new AppError("This grade already exists.", 409);
      }
    }

    const updatedGrade = await GradeModel.update(id, {
      ...mergedPayload,
      range_from:
        mergedPayload.range_from !== null
          ? Number(mergedPayload.range_from)
          : null,
      range_to:
        mergedPayload.range_to !== null
          ? Number(mergedPayload.range_to)
          : null,
    });

    res.status(200).json({
      success: true,
      message: "Grade updated successfully.",
      data: updatedGrade,
    });
  }
);

export const deleteGrade = catchAsync(
  async (req: Request, res: Response) => {
    const deletedGrade = await GradeModel.softDelete(Number(req.params.id));

    if (!deletedGrade) {
      throw new AppError("Grade not found or already deleted.", 404);
    }

    res.status(200).json({
      success: true,
      message: "Grade deleted successfully.",
    });
  }
);