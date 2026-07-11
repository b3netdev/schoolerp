import { Request, Response, NextFunction } from "express";
import {
    StreamModel,
    StreamPayload,
    StreamUpdatePayload,
} from "../models/stream.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

const cleanString = (value?: string): string | undefined => {
    if (typeof value !== "string") return undefined;

    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const allowedStatuses = ["active", "inactive"];

export class StreamController {
    // Get all streams
    static getAll = catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const statusParam = req.query.status;

            let status: "all" | "active" | "inactive" = "all";

            if (typeof statusParam === "string" && statusParam.trim() !== "") {
                const normalizedStatus = statusParam.trim().toLowerCase();

                const allowedStatuses = ["all", "active", "inactive"];

                if (!allowedStatuses.includes(normalizedStatus)) {
                    return next(new AppError("Invalid stream status filter.", 400));
                }

                status = normalizedStatus as "all" | "active" | "inactive";
            }

            const streams = await StreamModel.findAll(status);

            res.status(200).json({
                success: true,
                count: streams.length,
                message: "Streams fetched successfully.",
                data: streams,
            });
        }
    );

    // Get single stream by ID
    static getById = catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const id = Number(req.params.id);

            if (!id || Number.isNaN(id)) {
                return next(new AppError("Invalid stream ID.", 400));
            }

            const stream = await StreamModel.findById(id);

            if (!stream) {
                return next(new AppError("Stream not found.", 404));
            }

            res.status(200).json({
                success: true,
                message: "Stream fetched successfully.",
                data: stream,
            });
        }
    );

    // Create stream
    static create = catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const { name, status } = req.body as StreamPayload;

            const cleanName = cleanString(name);
            const cleanStatus = cleanString(status) || "active";

            if (!cleanName) {
                return next(new AppError("Stream name is required.", 400));
            }

            if (!allowedStatuses.includes(cleanStatus)) {
                return next(new AppError("Invalid stream status.", 400));
            }

            const stream = await StreamModel.create({
                name: cleanName,
                status: cleanStatus,
            });

            res.status(201).json({
                success: true,
                message: "Stream created successfully.",
                data: stream,
            });
        }
    );

    // Update stream
    static update = catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const id = Number(req.body.id);

            if (!id || Number.isNaN(id)) {
                return next(new AppError("Invalid stream ID.", 400));
            }

            const { name, status } = req.body as StreamUpdatePayload;

            const cleanName = cleanString(name);
            const cleanStatus = cleanString(status);

            if (!cleanName && !cleanStatus) {
                return next(
                    new AppError("At least one field is required to update stream.", 400)
                );
            }

            if (cleanStatus && !allowedStatuses.includes(cleanStatus)) {
                return next(new AppError("Invalid stream status.", 400));
            }

            const stream = await StreamModel.update(id, {
                name: cleanName,
                status: cleanStatus,
            });

            if (!stream) {
                return next(new AppError("Stream not found.", 404));
            }

            res.status(200).json({
                success: true,
                message: "Stream updated successfully.",
                data: stream,
            });
        }
    );

    // Soft delete stream
    static delete = catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const id = Number(req.params.id);

            if (!id || Number.isNaN(id)) {
                return next(new AppError("Invalid stream ID.", 400));
            }

            const stream = await StreamModel.delete(id);

            if (!stream) {
                return next(new AppError("Stream not found.", 404));
            }

            res.status(200).json({
                success: true,
                message: "Stream deleted successfully.",
                data: stream,
            });
        }
    );

    // Hard delete stream
    static hardDelete = catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const id = Number(req.params.id);

            if (!id || Number.isNaN(id)) {
                return next(new AppError("Invalid stream ID.", 400));
            }

            const deleted = await StreamModel.hardDelete(id);

            if (!deleted) {
                return next(new AppError("Stream not found.", 404));
            }

            res.status(200).json({
                success: true,
                message: "Stream permanently deleted successfully.",
            });
        }
    );
}