import { Request, Response, NextFunction } from "express";

import {
  SubjectModel,
  SubjectPayload,
  SubjectUpdatePayload,
} from "../models/subjects.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAllSubjects = catchAsync(
  async (req: Request, res: Response) => {
    const status = String(req.query.status ?? "all");

    const subjects = await SubjectModel.findAll(status);

    res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
    });
  },
);

export const getSubjectById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return next(new AppError("Invalid subject ID", 400));
    }

    const subject = await SubjectModel.findById(subjectId);

    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subject fetched successfully",
      data: subject,
    });
  },
);

export const getSubjectsByClassSectionId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const classSectionId = Number(req.params.classSectionId);

    if (!Number.isInteger(classSectionId) || classSectionId <= 0) {
      return next(new AppError("Invalid class section ID", 400));
    }

    const subjects = await SubjectModel.findByClassSectionId(classSectionId);

    res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
    });
  },
);

export const createSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const class_section_id = Number(req.body.class_section_id);
    const name = String(req.body.name ?? "").trim();
    const description =
      req.body.description === undefined || req.body.description === null
        ? null
        : String(req.body.description).trim();

    if (!Number.isInteger(class_section_id) || class_section_id <= 0) {
      return next(new AppError("Valid class section is required", 400));
    }

    if (!name) {
      return next(new AppError("Subject name is required", 400));
    }

    const payload: SubjectPayload = {
      class_section_id,
      name,
      description,
    };

    const subject = await SubjectModel.create(payload);

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  },
);

export const updateSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return next(new AppError("Invalid subject ID", 400));
    }

    const payload: SubjectUpdatePayload = {};

    if (req.body.class_section_id !== undefined) {
      const classSectionId = Number(req.body.class_section_id);

      if (!Number.isInteger(classSectionId) || classSectionId <= 0) {
        return next(new AppError("Valid class section is required", 400));
      }

      payload.class_section_id = classSectionId;
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (!name) {
        return next(new AppError("Subject name cannot be empty", 400));
      }

      payload.name = name;
    }

    if (req.body.description !== undefined) {
      payload.description =
        req.body.description === null
          ? null
          : String(req.body.description).trim();
    }

    if (Object.keys(payload).length === 0) {
      return next(new AppError("No subject data provided to update", 400));
    }

    const subject = await SubjectModel.update(subjectId, payload);

    if (!subject) {
      return next(new AppError("Subject not found or already deleted", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  },
);

export const deleteSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return next(new AppError("Invalid subject ID", 400));
    }

    const subject = await SubjectModel.delete(subjectId);

    if (!subject) {
      return next(new AppError("Subject not found or already deleted", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subject moved to trash successfully",
      data: subject,
    });
  },
);

export const restoreSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return next(new AppError("Invalid subject ID", 400));
    }

    const subject = await SubjectModel.restore(subjectId);

    if (!subject) {
      return next(new AppError("Deleted subject not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subject restored successfully",
      data: subject,
    });
  },
);

export const hardDeleteSubject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return next(new AppError("Invalid subject ID", 400));
    }

    const deleted = await SubjectModel.hardDelete(subjectId);

    if (!deleted) {
      return next(new AppError("Subject not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subject permanently deleted successfully",
    });
  },
);