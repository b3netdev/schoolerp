import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  ClassModel,
  type ClassPayload,
  type ClassUpdatePayload,
  type SectionPayload,
} from "../models/classes.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type RequestWithUser = Request & {
  user?: {
    academic_year_id?: number | string;
  };
};

const getClassId = (
  value: string | undefined,
): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid class ID.", 400);
  }

  return id;
};

/**
 * Gets the current academic year from your existing
 * isAuthenticated middleware.
 */
const getAcademicYearId = (
  req: Request,
): number => {
  const academicYearId = Number(
    (req as RequestWithUser).user
      ?.academic_year_id,
  );

  if (
    !Number.isInteger(academicYearId) ||
    academicYearId <= 0
  ) {
    throw new AppError(
      "Current academic session is missing or invalid.",
      400,
    );
  }

  return academicYearId;
};


const normalizeSections = (
  value: unknown,
): SectionPayload[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const rows = Array.isArray(value)
    ? value
    : [value];

  return rows.map((row) => {
    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row)
    ) {
      throw new AppError(
        "Each section must be a valid object.",
        400,
      );
    }

    const section = row as SectionPayload;

    if (section.id !== undefined) {
      const id = Number(section.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(
          "Section ID must be a valid number.",
          400,
        );
      }

      return { id };
    }

    if (
      typeof section.name !== "string" ||
      !section.name.trim()
    ) {
      throw new AppError(
        "Each new section requires a name.",
        400,
      );
    }

    const displayOrder = section.display_order;

    if (
      displayOrder !== undefined &&
      displayOrder !== null &&
      (
        !Number.isInteger(Number(displayOrder)) ||
        Number(displayOrder) < 0
      )
    ) {
      throw new AppError(
        "Section display order must be a non-negative integer.",
        400,
      );
    }

    return {
      name: section.name.trim(),
      description: section.description ?? null,
      display_order:
        displayOrder === undefined ||
          displayOrder === null ||
          String(displayOrder).trim() === ""
          ? null
          : Number(displayOrder),
    };
  });
};

const getDisplayOrder = (
  value: unknown,
): number | null => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const displayOrder = Number(value);

  if (
    !Number.isInteger(displayOrder) ||
    displayOrder < 0
  ) {
    throw new AppError(
      "Display order must be a non-negative integer.",
      400,
    );
  }

  return displayOrder;
};

export class ClassController {
  static getAll = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const status = String(
        req.query.status ?? "all",
      );

      if (
        ![
          "all",
          "active",
          "inactive",
          "trash",
        ].includes(status)
      ) {
        return next(
          new AppError(
            "Invalid class status filter.",
            400,
          ),
        );
      }

      const classes =
        await ClassModel.findByStatus(status);

      res.status(200).json({
        success: true,
        message: "Classes fetched successfully.",
        data: classes,
      });
    },
  );

  static getOne = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const classData =
        await ClassModel.findByIdWithSections(
          getClassId(req.params.id),
          getAcademicYearId(req),
        );

      if (!classData) {
        return next(
          new AppError("Class not found.", 404),
        );
      }

      res.status(200).json({
        success: true,
        data: classData,
      });
    },
  );

  static create = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const className = String(
        req.body.class_name ?? "",
      ).trim();

      const status = String(
        req.body.status ?? "active",
      ).trim();

      if (!className) {
        return next(
          new AppError(
            "Class name is required.",
            400,
          ),
        );
      }

      if (
        status !== "active" &&
        status !== "inactive"
      ) {
        return next(
          new AppError(
            "Invalid class status.",
            400,
          ),
        );
      }

      const sections = normalizeSections(
        req.body.sections,
      );

      const payload: ClassPayload = {
        class_name: className,
        status: status as ClassPayload["status"],
        description:
          req.body.description === undefined
            ? null
            : String(req.body.description).trim(),
        display_order: getDisplayOrder(
          req.body.display_order,
        ),
      };

      if (sections !== undefined) {
        payload.sections = sections;
      }

      const classData =
        await ClassModel.create(
          payload,
          sections?.length
            ? getAcademicYearId(req)
            : undefined,
        );

      res.status(201).json({
        success: true,
        message: "Class created successfully.",
        data: classData,
      });
    },
  );

  static update = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = getClassId(req.params.id);

      const payload: ClassUpdatePayload = {};

      if (req.body.class_name !== undefined) {
        const className = String(
          req.body.class_name,
        ).trim();

        if (!className) {
          return next(
            new AppError(
              "Class name cannot be empty.",
              400,
            ),
          );
        }

        payload.class_name = className;
      }

      if (req.body.status !== undefined) {
        const status = String(
          req.body.status,
        ).trim();

        if (
          status !== "active" &&
          status !== "inactive"
        ) {
          return next(
            new AppError(
              "Invalid class status.",
              400,
            ),
          );
        }

        payload.status =
          status as NonNullable<
            ClassUpdatePayload["status"]
          >;
      }

      if (req.body.description !== undefined) {
        payload.description =
          req.body.description === null
            ? null
            : String(req.body.description).trim();
      }

      if (req.body.display_order !== undefined) {
        payload.display_order = getDisplayOrder(
          req.body.display_order,
        );
      }

      const sections = normalizeSections(
        req.body.sections,
      );

      if (sections !== undefined) {
        payload.sections = sections;
      }

      if (Object.keys(payload).length === 0) {
        return next(
          new AppError(
            "At least one field is required to update a class.",
            400,
          ),
        );
      }

      const classData =
        await ClassModel.update(
          id,
          payload,
          sections?.length
            ? getAcademicYearId(req)
            : undefined,
        );

      if (!classData) {
        return next(
          new AppError("Class not found.", 404),
        );
      }

      res.status(200).json({
        success: true,
        message: "Class updated successfully.",
        data: classData,
      });
    },
  );

  static delete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const classData =
        await ClassModel.delete(
          getClassId(req.params.id),
        );

      if (!classData) {
        return next(
          new AppError(
            "Class not found or already deleted.",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class moved to trash successfully.",
        data: classData,
      });
    },
  );

  static restore = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const classData =
        await ClassModel.restore(
          getClassId(req.params.id),
        );

      if (!classData) {
        return next(
          new AppError(
            "Class not found in trash.",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message: "Class restored successfully.",
        data: classData,
      });
    },
  );

  static hardDelete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const deleted =
        await ClassModel.hardDelete(
          getClassId(req.params.id),
        );

      if (!deleted) {
        return next(
          new AppError("Class not found.", 404),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class permanently deleted successfully.",
      });
    },
  );
}