import type {
  NextFunction,
  Request,
  Response,
} from "express";
import sanitizeHtml from "sanitize-html";

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

const parseIdArray = (
  value: unknown,
  fieldName: string,
): number[] => {
  if (!Array.isArray(value)) {
    throw new AppError(
      `${fieldName} must be an array.`,
      400,
    );
  }

  const parsed = value.map((item, index) =>
    getValidId(item, `${fieldName}[${index}]`),
  );

  return [...new Set(parsed)];
};

const getSessionData = (req: Request) => {
  const userId = Number(req.user?.id);
  const academicYearId = Number(
    req.user?.academic_year_id,
  );

  if (!Number.isInteger(userId) || userId <= 0) {
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

const validateNoticeForList = (
  value: unknown,
): NoticeFor[] => {
  if (!Array.isArray(value)) {
    throw new AppError(
      "Notice audience must be an array.",
      400,
    );
  }

  const normalized = value.map((item) =>
    String(item).toLowerCase().trim(),
  );

  if (normalized.length === 0) {
    throw new AppError(
      "Select at least one notice audience.",
      400,
    );
  }

  const uniqueValues = [...new Set(normalized)];

  const invalidValue = uniqueValues.find(
    (item) => !allowedNoticeFor.includes(item as NoticeFor),
  );

  if (invalidValue) {
    throw new AppError(
      "Notice audience must be student, teacher, or admin.",
      400,
    );
  }

  return uniqueValues as NoticeFor[];
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

const sanitizeNoticeDescription = (rawHtml: unknown): string => {
  const html = String(rawHtml || "").trim();

  const sanitized = sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      p: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  }).trim();

  const plainText = sanitized.replace(/<[^>]*>/g, "").trim();

  if (!plainText) {
    throw new AppError(
      "Notice description is required.",
      400,
    );
  }

  return sanitized;
};

const validateClassIdsForAcademicYear = async (
  classIds: number[],
  academicYearId: number,
) => {
  const validClassIds =
    await NoticeModel.getValidClassIdsForAcademicYear(
      classIds,
      academicYearId,
    );

  if (validClassIds.length !== classIds.length) {
    throw new AppError(
      "One or more selected classes are not assigned in the selected academic year.",
      400,
    );
  }
};

export class NoticeController {
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

      const date = validateDate(req.query.date);

      let noticeFor: NoticeFor | undefined;

      if (req.query.notice_for) {
        const value = String(req.query.notice_for)
          .toLowerCase()
          .trim() as NoticeFor;

        if (!allowedNoticeFor.includes(value)) {
          throw new AppError(
            "Notice audience must be student, teacher, or admin.",
            400,
          );
        }

        noticeFor = value;
      }

      const notices = await NoticeModel.findAll(
        academicYearId,
        {
          status,
          class_id: classId,
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

  static create = catchAsync(
    async (req: Request, res: Response) => {
      const { userId, academicYearId } = getSessionData(req);

      const payload: CreateNoticePayload = {
        notice_for: validateNoticeForList(req.body.notice_for),
        title: String(req.body.title || "").trim(),
        description: sanitizeNoticeDescription(
          req.body.description,
        ),
        class_ids: parseIdArray(
          req.body.class_ids,
          "Class IDs",
        ),
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

      await validateClassIdsForAcademicYear(
        payload.class_ids,
        academicYearId,
      );

      const notice = await NoticeModel.create(
        payload,
        userId,
        academicYearId,
      );

      if (!notice) {
        throw new AppError(
          "Notice could not be created.",
          500,
        );
      }

      res.status(201).json({
        status: "success",
        message: "Notice posted successfully.",
        data: notice,
      });
    },
  );

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
        payload.notice_for = validateNoticeForList(
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
        payload.description = sanitizeNoticeDescription(
          req.body.description,
        );
      }

      if (req.body.class_ids !== undefined) {
        payload.class_ids = parseIdArray(
          req.body.class_ids,
          "Class IDs",
        );

        await validateClassIdsForAcademicYear(
          payload.class_ids,
          academicYearId,
        );
      }

      if (Object.keys(payload).length === 0) {
        throw new AppError(
          "Please provide at least one field to update.",
          400,
        );
      }

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