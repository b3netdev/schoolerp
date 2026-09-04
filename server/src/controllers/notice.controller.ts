import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  type CreateNoticePayload,
  NoticeModel,
  type NoticeFor,
  type NoticeStatus,
  type UpdateNoticePayload,
} from "../models/notice.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const allowedNoticeFor: NoticeFor[] = [
  "student",
  "teacher",
  "admin",
];

const getValidId = (
  value: unknown,
  fieldName: string,
): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(
      `${fieldName} must be a valid ID.`,
      400,
    );
  }

  return id;
};

const getOptionalId = (
  value: unknown,
  fieldName: string,
): number | undefined => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  return getValidId(value, fieldName);
};

const getSessionData = (req: Request) => {
  const userId = req.userId;
  const academicYearId = Number(
    req.user?.academic_year_id,
  );
  console.log(!Number.isInteger(userId))

  if (!userId ||  userId <= 0) {
    throw new AppError(
      "Logged-in user information is missing.",
      401,
    );
  }

  if (
    !Number.isInteger(academicYearId) ||
    academicYearId <= 0
  ) {
    throw new AppError(
      "Academic session is missing from the login session.",
      401,
    );
  }

  return {
    userId,
    academicYearId,
  };
};

const validateNoticeFor = (value: unknown): NoticeFor => {
  if (!allowedNoticeFor.includes(value as NoticeFor)) {
    throw new AppError(
      "Notice audience must be student, teacher, or admin.",
      400,
    );
  }

  return value as NoticeFor;
};

const validateDate = (
  value: unknown,
): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(
      "Date must be in YYYY-MM-DD format.",
      400,
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(
      "Date must be in YYYY-MM-DD format.",
      400,
    );
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError("Please select a valid date.", 400);
  }

  return value;
};

const validateClassSectionRelation = async (
  classId: number,
  sectionId: number,
  academicYearId: number,
) => {
  const isValid = await NoticeModel.isValidClassSection(
    classId,
    sectionId,
    academicYearId,
  );

  if (!isValid) {
    throw new AppError(
      "The selected section does not belong to the selected class in the current academic session.",
      400,
    );
  }
};

export class NoticeController {
  /*
    GET /notice/get-notices

    Optional query parameters:
    ?status=all
    ?date=2026-09-04
    ?class_id=1
    ?section_id=2
    ?notice_for=student
  */
  static getAll = catchAsync(
    async (req: Request, res: Response) => {
      const { academicYearId } = getSessionData(req);

      const statusValue = req.query.status;

      const status: NoticeStatus =
        statusValue === "trash"
          ? "trash"
          : statusValue === "active"
            ? "active"
            : "all";

      const classId = getOptionalId(
        req.query.class_id,
        "Class ID",
      );

      const sectionId = getOptionalId(
        req.query.section_id,
        "Section ID",
      );

      const date = validateDate(req.query.date);

      let noticeFor: NoticeFor | undefined;

      if (req.query.notice_for) {
        noticeFor = validateNoticeFor(
          req.query.notice_for,
        );
      }

      const notices = await NoticeModel.findAll(
        academicYearId,
        {
          status,
          class_id: classId,
          section_id: sectionId,
          date,
          notice_for: noticeFor,
        },
      );

      res.status(200).json({
        status: "success",
        results: notices.length,
        data: notices,
      });
    },
  );

  /*
    GET /notice/get-notice/:id
  */
  static getOne = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const { academicYearId } = getSessionData(req);

      const id = getValidId(req.params.id, "Notice ID");

      const notice = await NoticeModel.findById(
        id,
        academicYearId,
      );

      if (!notice) {
        return next(
          new AppError("Notice not found.", 404),
        );
      }

      res.status(200).json({
        status: "success",
        data: notice,
      });
    },
  );

  /*
    POST /notice/add-notice

    Frontend sends:
    {
      notice_for: "student",
      class_id: 1,
      section_id: 2, // optional
      title: "Holiday Notice",
      description: "School will remain closed tomorrow."
    }

    If section_id is empty:
    one notice row is inserted for every section
    belonging to the selected class.
  */
  static create = catchAsync(
    async (req: Request, res: Response) => {
      const { userId, academicYearId } = getSessionData(req);

      const classId = getValidId(
        req.body.class_id,
        "Class ID",
      );

      const payload: CreateNoticePayload = {
        notice_for: validateNoticeFor(req.body.notice_for),
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || "").trim(),
        class_id: classId,
      };

      if (!payload.title) {
        throw new AppError(
          "Notice title is required.",
          400,
        );
      }

      if (payload.title.length > 100) {
        throw new AppError(
          "Notice title cannot exceed 100 characters.",
          400,
        );
      }

      if (!payload.description) {
        throw new AppError(
          "Notice description is required.",
          400,
        );
      }

      const selectedSectionId = getOptionalId(
        req.body.section_id,
        "Section ID",
      );

      let sectionIds: number[] = [];

      if (selectedSectionId) {
        /*
          Admin selected one section:
          only one notice row will be inserted.
        */
        await validateClassSectionRelation(
          classId,
          selectedSectionId,
          academicYearId,
        );

        sectionIds = [selectedSectionId];
      } else {
        /*
          Admin did not select section:
          get all related sections and insert one row per section.
        */
        sectionIds = await NoticeModel.findSectionIdsByClass(
          classId,
          academicYearId,
        );

        if (sectionIds.length === 0) {
          throw new AppError(
            "No sections are assigned to the selected class.",
            400,
          );
        }
      }

      /*
        posted_by = req.userId
        academic_year_id = req.user.academic_year_id

        Frontend cannot control either value.
      */
      const notices = await NoticeModel.createMany(
        payload,
        userId,
        academicYearId,
        sectionIds,
      );

      res.status(201).json({
        status: "success",
        message:
          notices.length > 1
            ? `Notice posted successfully for ${notices.length} sections.`
            : "Notice posted successfully.",
        data: notices,
      });
    },
  );

  /*
    POST /notice/update-notice/:id

    Update changes only this one notice row.
    It does not update every section automatically.
  */
  static update = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const { academicYearId } = getSessionData(req);

      const id = getValidId(req.params.id, "Notice ID");

      const existingNotice = await NoticeModel.findById(
        id,
        academicYearId,
      );

      if (!existingNotice) {
        return next(
          new AppError("Notice not found.", 404),
        );
      }

      const payload: UpdateNoticePayload = {};

      if (req.body.notice_for !== undefined) {
        payload.notice_for = validateNoticeFor(
          req.body.notice_for,
        );
      }

      if (req.body.title !== undefined) {
        payload.title = String(req.body.title).trim();

        if (!payload.title) {
          throw new AppError(
            "Notice title cannot be empty.",
            400,
          );
        }

        if (payload.title.length > 100) {
          throw new AppError(
            "Notice title cannot exceed 100 characters.",
            400,
          );
        }
      }

      if (req.body.description !== undefined) {
        payload.description = String(
          req.body.description,
        ).trim();

        if (!payload.description) {
          throw new AppError(
            "Notice description cannot be empty.",
            400,
          );
        }
      }

      if (req.body.class_id !== undefined) {
        payload.class_id = getValidId(
          req.body.class_id,
          "Class ID",
        );
      }

      if (req.body.section_id !== undefined) {
        payload.section_id = getValidId(
          req.body.section_id,
          "Section ID",
        );
      }

      if (Object.keys(payload).length === 0) {
        throw new AppError(
          "Please provide at least one field to update.",
          400,
        );
      }

      const finalClassId =
        payload.class_id ?? existingNotice.class_id;

      const finalSectionId =
        payload.section_id ?? existingNotice.section_id;

      await validateClassSectionRelation(
        finalClassId,
        finalSectionId,
        academicYearId,
      );

      const notice = await NoticeModel.update(
        id,
        academicYearId,
        payload,
      );

      if (!notice) {
        return next(
          new AppError("Notice could not be updated.", 404),
        );
      }

      res.status(200).json({
        status: "success",
        message: "Notice updated successfully.",
        data: notice,
      });
    },
  );

  /*
    DELETE /notice/delete-notice/:id
  */
  static delete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const { academicYearId } = getSessionData(req);

      const id = getValidId(req.params.id, "Notice ID");

      const notice = await NoticeModel.softDelete(
        id,
        academicYearId,
      );

      if (!notice) {
        return next(
          new AppError("Notice not found.", 404),
        );
      }

      res.status(200).json({
        status: "success",
        message: "Notice moved to trash successfully.",
        data: notice,
      });
    },
  );

  /*
    PATCH /notice/restore-notice/:id
  */
  static restore = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const { academicYearId } = getSessionData(req);

      const id = getValidId(req.params.id, "Notice ID");

      const notice = await NoticeModel.restore(
        id,
        academicYearId,
      );

      if (!notice) {
        return next(
          new AppError("Deleted notice not found.", 404),
        );
      }

      res.status(200).json({
        status: "success",
        message: "Notice restored successfully.",
        data: notice,
      });
    },
  );

  /*
    DELETE /notice/hard-delete-notice/:id
  */
  static hardDelete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const { academicYearId } = getSessionData(req);

      const id = getValidId(req.params.id, "Notice ID");

      const deleted = await NoticeModel.hardDelete(
        id,
        academicYearId,
      );

      if (!deleted) {
        return next(
          new AppError("Notice not found.", 404),
        );
      }

      res.status(200).json({
        status: "success",
        message: "Notice permanently deleted successfully.",
      });
    },
  );
}