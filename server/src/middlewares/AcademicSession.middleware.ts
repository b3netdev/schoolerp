import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { AcademicSessionModel } from "../models/AcademicSession.model.js";

export const validateAcademicSessionId = async (req: Request, res: Response, next: NextFunction) => {
    const session = await AcademicSessionModel.findById(Number(req.params.id));
    if (!session) {
        return next(new AppError('Academic session not found', 404));
    }
    next();
};

