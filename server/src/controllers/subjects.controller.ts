import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  SubjectModel,
  SubjectPayload,
  SubjectUpdatePayload,
  normalizeSubjectListQuery,
} from "../models/subjects.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const getPositiveInteger = (
  value: unknown,
): number | null => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
};

/**
 * undefined = field was not sent
 * null = clear subject type
 * number = set selected subject type
 */
const parseSubjectTypeId = (
  value: unknown,
): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const subjectTypeId = getPositiveInteger(value);

  if (!subjectTypeId) {
    throw new AppError(
      "Valid subject type is required",
      400,
    );
  }

  return subjectTypeId;
};

const validateSubjectType = async (
  subjectTypeId: number | null | undefined,
): Promise<void> => {
  if (
    subjectTypeId === undefined ||
    subjectTypeId === null
  ) {
    return;
  }

  const exists =
    await SubjectModel.isSubjectTypeValid(
      subjectTypeId,
    );

  if (!exists) {
    throw new AppError(
      "Selected subject type does not exist or is deleted",
      400,
    );
  }
};

const parseDisplayOrder = (
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
      "Display order must be a valid non-negative integer",
      400,
    );
  }

  return displayOrder;
};

/**
 * GET ALL SUBJECTS
 *
 * Query examples:
 * /get-subjects?page=1&limit=10
 * /get-subjects?class_id=1
 * /get-subjects?section_id=2
 * /get-subjects?class_section_id=5
 * /get-subjects?status=trash
 */
export const getAllSubjects = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const query = normalizeSubjectListQuery(
      req.query as Record<string, unknown>,
    );

    const result = await SubjectModel.findAll(
      query.status,
      query.page,
      query.limit,
      query.classId,
      query.sectionId,
      query.classSectionId,
    );

    res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: result,
    });
  },
);

/**
 * GET SUBJECT BY ID
 */
export const getSubjectById = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const subjectId = getPositiveInteger(
      req.params.id,
    );

    if (!subjectId) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const subject =
      await SubjectModel.findById(subjectId);

    if (!subject) {
      return next(
        new AppError(
          "Subject not found",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message: "Subject fetched successfully",
      data: subject,
    });
  },
);

/**
 * GET SUBJECTS BY CLASS-SECTION RELATION ID
 */
export const getSubjectsByClassSectionId =
  catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const classSectionId = getPositiveInteger(
        req.params.classSectionId,
      );

      if (!classSectionId) {
        return next(
          new AppError(
            "Invalid class section ID",
            400,
          ),
        );
      }

      const subjects =
        await SubjectModel.findByClassSectionId(
          classSectionId,
        );

      res.status(200).json({
        success: true,
        message: "Subjects fetched successfully",
        data: subjects,
      });
    },
  );

/**
 * CREATE SUBJECT
 *
 * subject_type_id is optional.
 */
export const createSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const classSectionId = getPositiveInteger(
      req.body.class_section_id,
    );

    if (!classSectionId) {
      return next(
        new AppError(
          "Valid class section is required",
          400,
        ),
      );
    }

    const name = String(
      req.body.name ?? "",
    ).trim();

    if (!name) {
      return next(
        new AppError(
          "Subject name is required",
          400,
        ),
      );
    }

    const subjectTypeId = parseSubjectTypeId(
      req.body.subject_type_id,
    );

    await validateSubjectType(subjectTypeId);

    const description =
      req.body.description === undefined ||
      req.body.description === null
        ? null
        : String(req.body.description).trim() || null;

    const displayOrder = parseDisplayOrder(
      req.body.display_order,
    );

    const payload: SubjectPayload = {
      class_section_id: classSectionId,
      subject_type_id: subjectTypeId ?? null,
      name,
      description,
      display_order: displayOrder,
    };

    const subject =
      await SubjectModel.create(payload);

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  },
);

/**
 * UPDATE SUBJECT
 *
 * Send subject_type_id: null to remove
 * the selected subject type.
 */
export const updateSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const subjectId = getPositiveInteger(
      req.params.id,
    );

    if (!subjectId) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const payload: SubjectUpdatePayload = {};

    if (
      req.body.class_section_id !== undefined
    ) {
      const classSectionId = getPositiveInteger(
        req.body.class_section_id,
      );

      if (!classSectionId) {
        return next(
          new AppError(
            "Valid class section is required",
            400,
          ),
        );
      }

      payload.class_section_id = classSectionId;
    }

    if (req.body.subject_type_id !== undefined) {
      const subjectTypeId = parseSubjectTypeId(
        req.body.subject_type_id,
      );

      await validateSubjectType(subjectTypeId);

      payload.subject_type_id = subjectTypeId;
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (!name) {
        return next(
          new AppError(
            "Subject name cannot be empty",
            400,
          ),
        );
      }

      payload.name = name;
    }

    if (req.body.description !== undefined) {
      payload.description =
        req.body.description === null
          ? null
          : String(req.body.description).trim() || null;
    }

    if (req.body.display_order !== undefined) {
      payload.display_order = parseDisplayOrder(
        req.body.display_order,
      );
    }

    if (Object.keys(payload).length === 0) {
      return next(
        new AppError(
          "No subject data provided to update",
          400,
        ),
      );
    }

    const subject = await SubjectModel.update(
      subjectId,
      payload,
    );

    if (!subject) {
      return next(
        new AppError(
          "Subject not found or already deleted",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  },
);

/**
 * SOFT DELETE SUBJECT
 */
export const deleteSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const subjectId = getPositiveInteger(
      req.params.id,
    );

    if (!subjectId) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const subject =
      await SubjectModel.delete(subjectId);

    if (!subject) {
      return next(
        new AppError(
          "Subject not found or already deleted",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message: "Subject moved to trash successfully",
      data: subject,
    });
  },
);

/**
 * RESTORE SUBJECT
 */
export const restoreSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const subjectId = getPositiveInteger(
      req.params.id,
    );

    if (!subjectId) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const subject =
      await SubjectModel.restore(subjectId);

    if (!subject) {
      return next(
        new AppError(
          "Deleted subject not found",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message: "Subject restored successfully",
      data: subject,
    });
  },
);

/**
 * PERMANENT DELETE SUBJECT
 */
export const hardDeleteSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const subjectId = getPositiveInteger(
      req.params.id,
    );

    if (!subjectId) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const deleted =
      await SubjectModel.hardDelete(subjectId);

    if (!deleted) {
      return next(
        new AppError(
          "Subject not found",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Subject permanently deleted successfully",
    });
  },
);