import { Request, Response, NextFunction } from "express";

import {
  SubjectModel,
  SubjectPayload,
  SubjectUpdatePayload,
} from "../models/subjects.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * GET ALL SUBJECTS
 */
export const getAllSubjects = catchAsync(
  async (req: Request, res: Response) => {
    const status = String(req.query.status ?? "all");

    const subjects = await SubjectModel.findAll(status);

    res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
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
    const subjectId = Number(req.params.id);

    if (
      !Number.isInteger(subjectId) ||
      subjectId <= 0
    ) {
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
      message:
        "Subject fetched successfully",
      data: subject,
    });
  },
);

/**
 * GET SUBJECTS BY CLASS SECTION
 */
export const getSubjectsByClassSectionId =
  catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const classSectionId = Number(
        req.params.classSectionId,
      );

      if (
        !Number.isInteger(
          classSectionId,
        ) ||
        classSectionId <= 0
      ) {
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
        message:
          "Subjects fetched successfully",
        data: subjects,
      });
    },
  );

/**
 * CREATE SUBJECT
 */
export const createSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const class_section_id = Number(
      req.body.class_section_id,
    );

    const name = String(
      req.body.name ?? "",
    ).trim();

    const description =
      req.body.description === undefined ||
      req.body.description === null
        ? null
        : String(
            req.body.description,
          ).trim();

    /**
     * DISPLAY ORDER
     *
     * Keep null if input is empty.
     *
     * Do NOT do Number(null)
     * because Number(null) = 0.
     */
    let display_order:
      | number
      | null = null;

    if (
      req.body.display_order !==
        undefined &&
      req.body.display_order !== null &&
      String(
        req.body.display_order,
      ).trim() !== ""
    ) {
      display_order = Number(
        req.body.display_order,
      );

      if (
        !Number.isInteger(
          display_order,
        ) ||
        display_order < 0
      ) {
        return next(
          new AppError(
            "Display order must be a valid non-negative integer",
            400,
          ),
        );
      }
    }

    /**
     * Validate class section
     */
    if (
      !Number.isInteger(
        class_section_id,
      ) ||
      class_section_id <= 0
    ) {
      return next(
        new AppError(
          "Valid class section is required",
          400,
        ),
      );
    }

    /**
     * Validate subject name
     */
    if (!name) {
      return next(
        new AppError(
          "Subject name is required",
          400,
        ),
      );
    }

    const payload: SubjectPayload = {
      class_section_id,
      name,
      description,
      display_order,
    };

    const subject =
      await SubjectModel.create(payload);

    res.status(201).json({
      success: true,
      message:
        "Subject created successfully",
      data: subject,
    });
  },
);

/**
 * UPDATE SUBJECT
 */
export const updateSubject = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const subjectId = Number(
      req.params.id,
    );

    if (
      !Number.isInteger(subjectId) ||
      subjectId <= 0
    ) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const payload: SubjectUpdatePayload =
      {};

    /**
     * CLASS SECTION
     */
    if (
      req.body.class_section_id !==
      undefined
    ) {
      const classSectionId = Number(
        req.body.class_section_id,
      );

      if (
        !Number.isInteger(
          classSectionId,
        ) ||
        classSectionId <= 0
      ) {
        return next(
          new AppError(
            "Valid class section is required",
            400,
          ),
        );
      }

      payload.class_section_id =
        classSectionId;
    }

    /**
     * SUBJECT NAME
     */
    if (
      req.body.name !== undefined
    ) {
      const name = String(
        req.body.name,
      ).trim();

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

    /**
     * DESCRIPTION
     */
    if (
      req.body.description !==
      undefined
    ) {
      payload.description =
        req.body.description === null
          ? null
          : String(
              req.body.description,
            ).trim();
    }

    /**
     * DISPLAY ORDER
     */
    if (
      req.body.display_order !==
      undefined
    ) {
      /**
       * Allow clearing display order:
       *
       * ""   -> null
       * null -> null
       * "5"  -> 5
       */
      if (
        req.body.display_order ===
          null ||
        String(
          req.body.display_order,
        ).trim() === ""
      ) {
        payload.display_order = null;
      } else {
        const displayOrder = Number(
          req.body.display_order,
        );

        if (
          !Number.isInteger(
            displayOrder,
          ) ||
          displayOrder < 0
        ) {
          return next(
            new AppError(
              "Display order must be a valid non-negative integer",
              400,
            ),
          );
        }

        payload.display_order =
          displayOrder;
      }
    }

    if (
      Object.keys(payload).length ===
      0
    ) {
      return next(
        new AppError(
          "No subject data provided to update",
          400,
        ),
      );
    }

    const subject =
      await SubjectModel.update(
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
      message:
        "Subject updated successfully",
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
    const subjectId = Number(
      req.params.id,
    );

    if (
      !Number.isInteger(subjectId) ||
      subjectId <= 0
    ) {
      return next(
        new AppError(
          "Invalid subject ID",
          400,
        ),
      );
    }

    const subject =
      await SubjectModel.delete(
        subjectId,
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
      message:
        "Subject moved to trash successfully",
      data: subject,
    });
  },
);

/**
 * RESTORE SUBJECT
 */
export const restoreSubject =
  catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const subjectId = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(
          subjectId,
        ) ||
        subjectId <= 0
      ) {
        return next(
          new AppError(
            "Invalid subject ID",
            400,
          ),
        );
      }

      const subject =
        await SubjectModel.restore(
          subjectId,
        );

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
        message:
          "Subject restored successfully",
        data: subject,
      });
    },
  );

/**
 * PERMANENT DELETE SUBJECT
 */
export const hardDeleteSubject =
  catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const subjectId = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(
          subjectId,
        ) ||
        subjectId <= 0
      ) {
        return next(
          new AppError(
            "Invalid subject ID",
            400,
          ),
        );
      }

      const deleted =
        await SubjectModel.hardDelete(
          subjectId,
        );

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