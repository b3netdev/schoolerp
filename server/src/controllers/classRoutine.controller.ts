import type { NextFunction, Request, Response } from "express";

import {
  ClassRoutineModel,
  type CreateClassRoutinePayload,
  type DayOfWeek,
  type UpdateClassRoutinePayload,
} from "../models/classRoutine.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type RequestWithUser = Request & {
  user?: {
    academic_year_id?: number | string;
  };
};

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const getAcademicYearId = (req: Request): number => {
  const academicYearId = Number(
    (req as RequestWithUser).user?.academic_year_id,
  );

  if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
    throw new AppError("Current academic session is missing or invalid.", 400);
  }

  return academicYearId;
};

const getId = (value: unknown, fieldName: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${fieldName} must be a valid ID.`, 400);
  }

  return id;
};

const getDayOfWeek = (value: unknown): DayOfWeek => {
  const dayOfWeek = Number(value);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) {
    throw new AppError(
      "Day of week must be a number between 1 (Monday) and 6 (Saturday).",
      400,
    );
  }

  return dayOfWeek as DayOfWeek;
};

const getTime = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string") {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  const time = value.trim();
  const isValidTime = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time);

  if (!isValidTime) {
    throw new AppError(
      `${fieldName} must use valid 24-hour time, for example 09:30.`,
      400,
    );
  }

  return time;
};

const getNullableId = (value: unknown, fieldName: string): number | null => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  return getId(value, fieldName);
};

const getNullableText = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;

  const text = String(value).trim();
  return text || null;
};

const getTimeInMinutes = (time: string): number => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const validateStartAndEndTime = (startTime: string, endTime: string): void => {
  if (getTimeInMinutes(endTime) <= getTimeInMinutes(startTime)) {
    throw new AppError("End time must be after start time.", 400);
  }
};

export class ClassRoutineController {
  
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const status = String(req.query.status ?? "all");

      if (status !== "all" && status !== "trash") {
        return next(new AppError("Invalid routine status filter.", 400));
      }

      const classId =
        req.query.class_id === undefined
          ? undefined
          : getId(req.query.class_id, "Class");

      const sectionId =
        req.query.section_id === undefined
          ? undefined
          : getId(req.query.section_id, "Section");

      const dayOfWeek =
        req.query.day_of_week === undefined
          ? undefined
          : getDayOfWeek(req.query.day_of_week);

      const routines = await ClassRoutineModel.findAll(getAcademicYearId(req), {
        status,
        class_id: classId,
        section_id: sectionId,
        day_of_week: dayOfWeek,
      });

      res.status(200).json({
        success: true,
        message: "Routines fetched successfully.",
        data: routines,
      });
    },
  );


  static getOne = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const routine = await ClassRoutineModel.findById(
        getId(req.params.id, "Routine"),
        getAcademicYearId(req),
      );

      if (!routine) {
        return next(new AppError("Routine not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Routine fetched successfully.",
        data: routine,
      });
    },
  );


  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body as Record<string, unknown>;
      const academicYearId = getAcademicYearId(req);

      const payload: CreateClassRoutinePayload = {
        class_id: getId(body.class_id, "Class"),
        section_id: getId(body.section_id, "Section"),
        subject_id: getId(body.subject_id, "Subject"),
        teacher_id: getNullableId(body.teacher_id, "Teacher"),
        day_of_week: getDayOfWeek(body.day_of_week),
        start_time: getTime(body.start_time, "Start time"),
        end_time: getTime(body.end_time, "End time"),
        room_number: getNullableText(body.room_number),
        remarks: getNullableText(body.remarks),
      };

      validateStartAndEndTime(payload.start_time, payload.end_time);

      const isValidClassSection = await ClassRoutineModel.isClassSectionValid(
        payload.class_id,
        payload.section_id,
        academicYearId,
      );

      if (!isValidClassSection) {
        return next(
          new AppError(
            "This section is not assigned to the selected class in the current academic session.",
            400,
          ),
        );
      }

      const routine = await ClassRoutineModel.create(payload, academicYearId);

      res.status(201).json({
        success: true,
        message: "Routine created successfully.",
        data: routine,
      });
    },
  );


  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body as Record<string, unknown>;
      const routineId = getId(req.params.id, "Routine");
      const academicYearId = getAcademicYearId(req);
      const existingRoutine = await ClassRoutineModel.findById(
        routineId,
        academicYearId,
      );

      if (!existingRoutine) {
        return next(new AppError("Routine not found.", 404));
      }

      const payload: UpdateClassRoutinePayload = {};

      if (hasOwn(body, "class_id")) {
        payload.class_id = getId(body.class_id, "Class");
      }

      if (hasOwn(body, "section_id")) {
        payload.section_id = getId(body.section_id, "Section");
      }

      if (hasOwn(body, "subject_id")) {
        payload.subject_id = getId(body.subject_id, "Subject");
      }

      if (hasOwn(body, "teacher_id")) {
        payload.teacher_id = getNullableId(body.teacher_id, "Teacher");
      }

      if (hasOwn(body, "day_of_week")) {
        payload.day_of_week = getDayOfWeek(body.day_of_week);
      }

      if (hasOwn(body, "start_time")) {
        payload.start_time = getTime(body.start_time, "Start time");
      }

      if (hasOwn(body, "end_time")) {
        payload.end_time = getTime(body.end_time, "End time");
      }

      if (hasOwn(body, "room_number")) {
        payload.room_number = getNullableText(body.room_number);
      }

      if (hasOwn(body, "remarks")) {
        payload.remarks = getNullableText(body.remarks);
      }

      if (Object.keys(payload).length === 0) {
        return next(
          new AppError("At least one field is required to update.", 400),
        );
      }

      const classId = payload.class_id ?? existingRoutine.class_id;
      const sectionId = payload.section_id ?? existingRoutine.section_id;
      const startTime = payload.start_time ?? existingRoutine.start_time;
      const endTime = payload.end_time ?? existingRoutine.end_time;

      validateStartAndEndTime(startTime, endTime);

      const isValidClassSection = await ClassRoutineModel.isClassSectionValid(
        classId,
        sectionId,
        academicYearId,
      );

      if (!isValidClassSection) {
        return next(
          new AppError(
            "This section is not assigned to the selected class in the current academic session.",
            400,
          ),
        );
      }

      const routine = await ClassRoutineModel.update(
        routineId,
        payload,
        academicYearId,
      );

      if (!routine) {
        return next(new AppError("Routine could not be updated.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Routine updated successfully.",
        data: routine,
      });
    },
  );

 
  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const routine = await ClassRoutineModel.delete(
        getId(req.params.id, "Routine"),
        getAcademicYearId(req),
      );

      if (!routine) {
        return next(new AppError("Routine not found or already deleted.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Routine moved to trash successfully.",
        data: routine,
      });
    },
  );

 
  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const routine = await ClassRoutineModel.restore(
        getId(req.params.id, "Routine"),
        getAcademicYearId(req),
      );

      if (!routine) {
        return next(new AppError("Routine not found in trash.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Routine restored successfully.",
        data: routine,
      });
    },
  );

 
  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const isDeleted = await ClassRoutineModel.hardDelete(
        getId(req.params.id, "Routine"),
        getAcademicYearId(req),
      );

      if (!isDeleted) {
        return next(new AppError("Routine not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Routine permanently deleted successfully.",
      });
    },
  );
}
