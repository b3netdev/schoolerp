import { NextFunction, Request, Response } from "express";

import {
  SectionModel,
  SectionPayload,
  SectionUpdatePayload,
} from "../models/section.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export class SectionController {
  /**
   * GET ALL SECTIONS
   */
  static findAll = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const status =
        (req.query.status as string) || "all";

      const allowedStatuses = [
        "all",
        "active",
        "inactive",
        "trash",
      ];

      if (!allowedStatuses.includes(status)) {
        return next(
          new AppError(
            "Invalid section status filter",
            400,
          ),
        );
      }

      const sections =
        await SectionModel.findByStatus(status);

      res.status(200).json({
        success: true,
        message: "Sections fetched successfully",
        data: sections,
      });
    },
  );

  /**
   * GET SECTION BY ID
   */
  static findById = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return next(
          new AppError(
            "Invalid section ID",
            400,
          ),
        );
      }

      const section =
        await SectionModel.findById(id);

      if (!section) {
        return next(
          new AppError(
            "Section not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message: "Section fetched successfully",
        data: section,
      });
    },
  );

  /**
   * CREATE SECTION
   */
  static create = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const {
        name,
        stream_id,
        status,
        description,
        display_order,
      } = req.body as SectionPayload;

      /*
       * Name validation
       */
      if (
        !name ||
        typeof name !== "string" ||
        !name.trim()
      ) {
        return next(
          new AppError(
            "Section name is required",
            400,
          ),
        );
      }

      /*
       * Stream validation
       */
      if (
        !stream_id ||
        !String(stream_id).trim()
      ) {
        return next(
          new AppError(
            "Stream is required",
            400,
          ),
        );
      }

      /*
       * Display order validation
       */
      const displayOrder =
        Number(display_order);

      if (
        !Number.isInteger(displayOrder) ||
        displayOrder < 0
      ) {
        return next(
          new AppError(
            "Display order must be a valid non-negative integer",
            400,
          ),
        );
      }

      const section =
        await SectionModel.create({
          name: name.trim(),

          stream_id:
            String(stream_id).trim(),

          status:
            status?.trim() || "active",

          description:
            description?.trim() || "",

          display_order:
            displayOrder,
        });

      res.status(201).json({
        success: true,
        message:
          "Section created successfully",
        data: section,
      });
    },
  );

  /**
   * UPDATE SECTION
   */
  static update = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.body.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return next(
          new AppError(
            "Invalid section ID",
            400,
          ),
        );
      }

      const {
        name,
        stream_id,
        status,
        description,
        display_order,
      } = req.body as SectionUpdatePayload;

      /*
       * Check whether anything has actually
       * been sent for update.
       *
       * Don't use:
       *
       * if (!name && !stream_id ...)
       *
       * because values such as 0 are valid.
       */
      if (
        name === undefined &&
        stream_id === undefined &&
        status === undefined &&
        description === undefined &&
        display_order === undefined
      ) {
        return next(
          new AppError(
            "At least one field is required to change",
            400,
          ),
        );
      }

      /*
       * Prepare display order only if
       * frontend actually sent it.
       */
      let displayOrder:
        | number
        | undefined;

      if (display_order !== undefined) {
        displayOrder =
          Number(display_order);

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
      }

      const section =
        await SectionModel.update(id, {
          name:
            name !== undefined
              ? name.trim()
              : undefined,

          stream_id:
            stream_id !== undefined
              ? String(
                  stream_id,
                ).trim()
              : undefined,

          status:
            status !== undefined
              ? status.trim()
              : undefined,

          description:
            description !== undefined
              ? description.trim()
              : undefined,

          display_order:
            displayOrder,
        });

      if (!section) {
        return next(
          new AppError(
            "Section not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Section updated successfully",
        data: section,
      });
    },
  );

  /**
   * SOFT DELETE SECTION
   */
  static delete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return next(
          new AppError(
            "Invalid section ID",
            400,
          ),
        );
      }

      const section =
        await SectionModel.delete(id);

      if (!section) {
        return next(
          new AppError(
            "Section not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Section moved to trash successfully",
        data: section,
      });
    },
  );

  /**
   * RESTORE SECTION
   */
  static restore = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return next(
          new AppError(
            "Invalid section ID",
            400,
          ),
        );
      }

      const section =
        await SectionModel.restore(id);

      if (!section) {
        return next(
          new AppError(
            "Section not found in trash",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Section restored successfully",
        data: section,
      });
    },
  );

  /**
   * PERMANENT DELETE SECTION
   */
  static hardDelete = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return next(
          new AppError(
            "Invalid section ID",
            400,
          ),
        );
      }

      const success =
        await SectionModel.hardDelete(id);

      if (!success) {
        return next(
          new AppError(
            "Section not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Section permanently deleted",
        data: {
          id,
        },
      });
    },
  );
}