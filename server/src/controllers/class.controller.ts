import { NextFunction, Request, Response } from "express";
import {
    ClassModel,
    ClassPayload,
    ClassUpdatePayload,
} from "../models/classes.model.js";
import { AppError } from "../utils/AppError.js";

export class ClassController {
    static async findAll(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const status = req.query.status as string || "all";
            const classes = await ClassModel.findByStatus(status);

            res.status(200).json({
                success: true,
                message: "Classes fetched successfully",
                data: classes,
            });
        } catch (error) {
            return next(new AppError("Failed to fetch class data", 500));
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
                    message: "Invalid class ID",
                });
                return;
            }

            const classData = await ClassModel.findById(id);

            if (!classData) {
                return next(new AppError("Class not found", 404));
            }

            res.status(200).json({
                success: true,
                message: "Class fetched successfully",
                data: classData,
            });
        } catch (error) {
            return next(new AppError("Failed to fetch class data", 500));
        }
    }

    static async create(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { class_name, status, description } = req.body as ClassPayload;

            if (!class_name || !status) {
                return next(new AppError("Class name and status are required", 400));
            }

            const classData = await ClassModel.create({
                class_name: class_name.trim(),
                status: status.trim(),
                description: description?.trim() ?? "",
            });

            res.status(201).json({
                success: true,
                message: "Class created successfully",
                data: classData,
            });
        } catch (error) {
            return next(new AppError("Failed to create class", 500));
        }
    }

    static async update(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const id = Number(req.body.id);

            if (!id || Number.isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid class ID",
                });
                return;
            }

            const { class_name, status, description } =
                req.body as ClassUpdatePayload;

            if (!class_name && !status && !description) {
                return next(
                    new AppError("At least one field is required to change", 400),
                );
            }

            const classData = await ClassModel.update(id, {
                class_name: class_name?.trim(),
                status: status?.trim(),
                description: description?.trim(),
            });

            if (!classData) {
                return next(new AppError("Class not found", 404));
            }

            res.status(200).json({
                success: true,
                message: "Class updated successfully",
                data: classData,
            });
        } catch (error) {
            return next(new AppError("Failed to update class", 500));
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
                    message: "Invalid class ID",
                });
                return;
            }

            const classData = await ClassModel.delete(id);

            if (!classData) {
                res.status(404).json({
                    success: false,
                    message: "Class not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Class deleted successfully",
                data: classData,
            });
        } catch (error) {
            return next(new AppError("Failed to delete class", 500));
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
                    message: "Invalid class ID",
                });
                return;
            }

            const classData = await ClassModel.restore(id);

            if (!classData) {
                res.status(404).json({
                    success: false,
                    message: "Class not found in trash",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Class restored successfully",
                data: classData,
            });
        } catch (error) {
            return next(new AppError("Failed to restore class", 500));
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
                    message: "Invalid class ID",
                });
                return;
            }

            const success = await ClassModel.hardDelete(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: "Class not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Class permanently deleted",
                data: { id },
            });
        } catch (error) {
            return next(new AppError("Failed to permanently delete class", 500));
        }
    }
}