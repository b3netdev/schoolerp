import { Request, Response } from "express";
import {
  SectionModel,
  SectionPayload,
  SectionUpdatePayload,
} from "../models/section.model.js";

export class SectionController {
  static async findAll(req: Request, res: Response): Promise<void> {
    try {
      const sections = await SectionModel.findAll();

      res.status(200).json({
        success: true,
        message: "Sections fetched successfully",
        data: sections,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch sections",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async findById(req: Request, res: Response): Promise<void> {
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
        res.status(404).json({
          success: false,
          message: "Section not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Section fetched successfully",
        data: section,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch section",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, stream } = req.body as SectionPayload;

      if (!name || !stream) {
        res.status(400).json({
          success: false,
          message: "Name and stream are required",
        });
        return;
      }

      const section = await SectionModel.create({
        name: name.trim(),
        stream: stream.trim(),
      });

      res.status(201).json({
        success: true,
        message: "Section created successfully",
        data: section,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create section",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.body;

      if (!id || Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
        return;
      }

      const { name, stream } = req.body as SectionUpdatePayload;

      if (!name && !stream) {
        res.status(400).json({
          success: false,
          message: "At least one field is required to update",
        });
        return;
      }

      const section = await SectionModel.update(id, {
        name: name?.trim(),
        stream: stream?.trim(),
      });   

      if (!section) {
        res.status(404).json({
          success: false,
          message: "Section not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Section updated successfully",
        data: section,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update section",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({
        success: false,
        message: "Failed to delete section",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}