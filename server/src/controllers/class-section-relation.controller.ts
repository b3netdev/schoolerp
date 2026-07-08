import { Request, Response, NextFunction } from "express";
import {
  ClassSectionRelationModel,
  ClassSectionRelationPayload,
  ClassSectionRelationUpdatePayload,
} from "../models/class-section-relation.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

export class ClassSectionRelationController {
  // Get all class-section-teacher relations
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const relations = await ClassSectionRelationModel.findAll();

      res.status(200).json({
        success: true,
        count: relations.length,
        message: "Class section relations fetched successfully.",
        data: relations,
      });
    }
  );

  // Get single relation by ID
  static getById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const relation = await ClassSectionRelationModel.findById(id);

      if (!relation) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation fetched successfully.",
        data: relation,
      });
    }
  );

  // Create class-section-teacher relation
  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { class_id, section_id, teacher_id } =
        req.body as ClassSectionRelationPayload;

      const classId = Number(class_id);
      const sectionId = Number(section_id);
      const teacherId = Number(teacher_id);

      if (!classId || Number.isNaN(classId)) {
        return next(new AppError("Class is required.", 400));
      }

      if (!sectionId || Number.isNaN(sectionId)) {
        return next(new AppError("Section is required.", 400));
      }

      if (!teacherId || Number.isNaN(teacherId)) {
        return next(new AppError("Teacher is required.", 400));
      }

      const relation = await ClassSectionRelationModel.create({
        class_id: classId,
        section_id: sectionId,
        teacher_id: teacherId,
      });

      res.status(201).json({
        success: true,
        message: "Class section relation created successfully.",
        data: relation,
      });
    }
  );

  // Update class-section-teacher relation
  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.body.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const { class_id, section_id, teacher_id } =
        req.body as ClassSectionRelationUpdatePayload;

      if (!class_id && !section_id && !teacher_id) {
        return next(
          new AppError("At least one field is required to update relation.", 400)
        );
      }

      const relation = await ClassSectionRelationModel.update(id, {
        class_id: class_id ? Number(class_id) : undefined,
        section_id: section_id ? Number(section_id) : undefined,
        teacher_id: teacher_id ? Number(teacher_id) : undefined,
      });

      if (!relation) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation updated successfully.",
        data: relation,
      });
    }
  );

  // Delete class-section-teacher relation
  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const relation = await ClassSectionRelationModel.delete(id);

      if (!relation) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation deleted successfully.",
        data: relation,
      });
    }
  );

  // Hard delete class-section-teacher relation
  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const deleted = await ClassSectionRelationModel.hardDelete(id);

      if (!deleted) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation permanently deleted successfully.",
      });
    }
  );
}