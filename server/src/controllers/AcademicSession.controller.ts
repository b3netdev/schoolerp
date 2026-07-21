import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import { AcademicSessionModel } from "../models/AcademicSession.model.js";

type AcademicSessionStatusFilter = "all" | "active" | "inactive" | "trash";

export class AcademicSessionController {
    static findAll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const statusParam = req.query.status;

        let status: AcademicSessionStatusFilter = "all";

        if (typeof statusParam === "string" && statusParam.trim() !== "") {
            const normalizedStatus = statusParam.trim().toLowerCase();

            const allowedStatuses: AcademicSessionStatusFilter[] = [
                "all",
                "active",
                "inactive",
                "trash",
            ];

            if (!allowedStatuses.includes(normalizedStatus as AcademicSessionStatusFilter)) {
                return next(new AppError("Invalid academic session status filter", 400));
            }

            status = normalizedStatus as AcademicSessionStatusFilter;
        }

        const sessions = await AcademicSessionModel.findAll(status);
        res.status(200).json({
            status: 'success',
            data: sessions
        });
    });

    static findById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const session = await AcademicSessionModel.findById(Number(req.params.id));
        if (!session) {
            return next(new AppError('Academic session not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: session
        });
    });

    static create = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const session = await AcademicSessionModel.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Academic session created successfully',
            data: session
        });
    });

    static update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);

        if (req.body?.status === 'active') {
            const hasActiveSession = await AcademicSessionModel.hasActiveSession(id);
            if (hasActiveSession) {
                return next(new AppError('An active academic session already exists. Please deactivate it before setting this session to active.', 409));
            }
        }

        const session = await AcademicSessionModel.update(id, req.body);
        if (!session) {
            return next(new AppError('Academic session not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: session
        });
    });

    static delete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const session = await AcademicSessionModel.findById(Number(req.params.id));
        if (!session) {
            return next(new AppError('Academic session not found', 404));
        }
        if (session.status === 'active') {
            return next(new AppError('Cannot delete an active academic session. Please deactivate it before deletion.', 400));
        }
        // Soft delete the academic session
        await AcademicSessionModel.delete(Number(req.params.id));
        res.status(204).json({
            success: true,
            status: 'success',
            message: 'Academic session deleted successfully',
            data: null
        });
    });

    static restore = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);

        console.log("Attempting to restore academic session with ID:", id); // Debugging line
        
        // Find the session in trash
        const trashedSession = await AcademicSessionModel.findTrashByID(id);

        console.log("Trashed Session:", trashedSession); // Debugging line
        
        if (!trashedSession) {
            return next(new AppError('Academic session not found in trash', 404));
        }
        
        // Check if a session with the same name already exists in non-deleted records
        const nameExists = await AcademicSessionModel.alreadyExists('name', trashedSession.name);
        
        if (nameExists) {
            return next(new AppError(`An academic session with the name "${trashedSession.name}" already exists. Please rename it before restoring.`, 400));
        }

        // Check if restoring an active session would conflict with an already active one
        if (trashedSession.status === 'active') {
            const hasActiveSession = await AcademicSessionModel.hasActiveSession();
            if (hasActiveSession) {
                return next(new AppError('An active academic session already exists. Please deactivate it before restoring this active session.', 409));
            }
        }

        // Restore the session
        const session = await AcademicSessionModel.restore(id);
        if (!session) {
            return next(new AppError('Failed to restore academic session', 500));
        }
        
        res.status(200).json({
            status: 'success',
            data: session
        });
    });

    static permanentDelete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        await AcademicSessionModel.permanentDelete(Number(req.params.id));
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    
}