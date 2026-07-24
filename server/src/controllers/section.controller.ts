import { NextFunction, Request, Response } from "express";
import {
  SectionModel,
  SectionPayload,
  SectionUpdatePayload,
} from "../models/section.model.js";
import { AppError } from "../utils/AppError.js";

export class SectionController {
  static async findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as string || "all";
      const sections = await SectionModel.findByStatus(status);

      res.status(200).json({
        success: true,
        message: "Sections fetched successfully",
        data: sections,
      });
    } catch (error) {
      return next(new AppError("Failed to fetch section data", 500));
    }
  }

  static async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
        return;
      }

      const section = await SectionModel.findById(id);

      if (!section) {
        return next(new AppError("Failed to fetch section data", 500));
      }

      res.status(200).json({
        success: true,
        message: "Section fetched successfully",
        data: section,
      });
    } catch (error) {
      return next(new AppError("Failed to fetch section data", 500));
    }
  }

  static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, stream, status, description } = req.body as SectionPayload;

      if (!name) {
        return next(new AppError("Name is required", 400));
      }

      const section = await SectionModel.create({
        name: name.trim(),
        stream: stream.trim(),
        status: status?.trim() || "active",
        description: description?.trim() || ""
      });

      res.status(201).json({
        success: true,
        message: "Section created successfully",
        data: section,
      });
    } catch (error) {
      return next(new AppError("Failed to create section", 500));
    }
  }

  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.body.id;

      if (!id || Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
        return;
      }

      const { name, stream, status, description } = req.body as SectionUpdatePayload;

      if (!name && !stream && !status && !description) {
        return next(
          new AppError("At least one field is required to change", 400),
        );
      }

      const section = await SectionModel.update(id, {
        name: name?.trim(),
        stream: stream?.trim(),
        status: status?.trim(),
        description: description?.trim()
      });

      if (!section) {
        return next(new AppError("Section not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Section updated successfully",
        data: section,
      });
    } catch (error) {
      return next(new AppError("Failed to update section", 500));
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
        return;
      }

      const section = await SectionModel.delete(id);

      if (!section) {
        res.status(404).json({
          success: false,
          message: "Section not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Section deleted successfully",
        data: section,
      });
    } catch (error) {
      return next(new AppError("Failed to delete section", 500));
    }
  }

  static async restore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
        return;
      }

      const section = await SectionModel.restore(id);

      if (!section) {
        res.status(404).json({
          success: false,
          message: "Section not found in trash",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Section restored successfully",
        data: section,
      });
    } catch (error) {
      return next(new AppError("Failed to restore section", 500));
    }
  }

  static async hardDelete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
        return;
      }

      const success = await SectionModel.hardDelete(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: "Section not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Section permanently deleted",
        data: { id },
      });
    } catch (error) {
      return next(new AppError("Failed to permanently delete section", 500));
    }
  }
}
