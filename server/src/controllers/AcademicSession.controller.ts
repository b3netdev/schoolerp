import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import { AcademicSessionModel } from "../models/AcademicSession.model.js";

export class AcademicSessionController {
    static findAll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const sessions = await AcademicSessionModel.findAll();
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
            status: 'success',
            data: session
        });
    });

    static update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const session = await AcademicSessionModel.update(Number(req.params.id), req.body);
        if (!session) {
            return next(new AppError('Academic session not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: session
        });
    });

    static delete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        await AcademicSessionModel.delete(Number(req.params.id));
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    
}