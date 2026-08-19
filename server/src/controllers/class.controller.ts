import { NextFunction, Request, Response } from "express";

import {
  ClassModel,
  ClassPayload,
  ClassUpdatePayload,
} from "../models/classes.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export class ClassController {
  /**
   * GET ALL CLASSES
   */
  static findAll = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const status = String(
        req.query.status ?? "all",
      );

      const allowedStatuses = [
        "all",
        "active",
        "inactive",
        "trash",
      ];

      if (!allowedStatuses.includes(status)) {
        return next(
          new AppError(
            "Invalid class status filter",
            400,
          ),
        );
      }

      const classes =
        await ClassModel.findByStatus(status);

      res.status(200).json({
        success: true,
        message: "Classes fetched successfully",
        data: classes,
      });
    },
  );

  /**
   * GET CLASS BY ID
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
            "Invalid class ID",
            400,
          ),
        );
      }

      const classData =
        await ClassModel.findById(id);

      if (!classData) {
        return next(
          new AppError(
            "Class not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class fetched successfully",
        data: classData,
      });
    },
  );

  /**
   * CREATE CLASS
   */
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

      const description = String(
        req.body.description ?? "",
      ).trim();

      /**
       * DISPLAY ORDER
       *
       * Important:
       * Number(null) === 0
       * Number("") === 0
       *
       * So check first.
       */
      let displayOrder:
        | number
        | null = null;

      if (
        req.body.display_order !== undefined &&
        req.body.display_order !== null &&
        String(
          req.body.display_order,
        ).trim() !== ""
      ) {
        displayOrder = Number(
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
      }

      /**
       * Validation
       */
      if (!className) {
        return next(
          new AppError(
            "Class name is required",
            400,
          ),
        );
      }

      if (!status) {
        return next(
          new AppError(
            "Class status is required",
            400,
          ),
        );
      }

      if (
        !["active", "inactive"].includes(status)
      ) {
        return next(
          new AppError(
            "Invalid class status",
            400,
          ),
        );
      }

      const payload: ClassPayload = {
        class_name: className,
        status,
        description,
        display_order: displayOrder,
      };

      const classData =
        await ClassModel.create(payload);

      res.status(201).json({
        success: true,
        message:
          "Class created successfully",
        data: classData,
      });
    },
  );

  /**
   * UPDATE CLASS
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
            "Invalid class ID",
            400,
          ),
        );
      }

      const payload: ClassUpdatePayload = {};

      /**
       * CLASS NAME
       */
      if (
        req.body.class_name !== undefined
      ) {
        const className = String(
          req.body.class_name,
        ).trim();

        if (!className) {
          return next(
            new AppError(
              "Class name cannot be empty",
              400,
            ),
          );
        }

        payload.class_name = className;
      }

      /**
       * STATUS
       */
      if (
        req.body.status !== undefined
      ) {
        const status = String(
          req.body.status,
        ).trim();

        if (
          !["active", "inactive"].includes(status)
        ) {
          return next(
            new AppError(
              "Invalid class status",
              400,
            ),
          );
        }

        payload.status = status;
      }

      /**
       * DESCRIPTION
       */
      if (
        req.body.description !== undefined
      ) {
        payload.description =
          req.body.description === null
            ? ""
            : String(
                req.body.description,
              ).trim();
      }

      /**
       * DISPLAY ORDER
       *
       * undefined -> don't change
       * null      -> clear value
       * ""        -> clear value
       * "5"       -> 5
       */
      if (
        req.body.display_order !== undefined
      ) {
        if (
          req.body.display_order === null ||
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

      /**
       * Nothing supplied
       */
      if (
        Object.keys(payload).length === 0
      ) {
        return next(
          new AppError(
            "At least one field is required to change",
            400,
          ),
        );
      }

      const classData =
        await ClassModel.update(
          id,
          payload,
        );

      if (!classData) {
        return next(
          new AppError(
            "Class not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class updated successfully",
        data: classData,
      });
    },
  );

  /**
   * SOFT DELETE CLASS
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
            "Invalid class ID",
            400,
          ),
        );
      }

      const classData =
        await ClassModel.delete(id);

      if (!classData) {
        return next(
          new AppError(
            "Class not found or already deleted",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class moved to trash successfully",
        data: classData,
      });
    },
  );

  /**
   * RESTORE CLASS
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
            "Invalid class ID",
            400,
          ),
        );
      }

      const classData =
        await ClassModel.restore(id);

      if (!classData) {
        return next(
          new AppError(
            "Class not found in trash",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class restored successfully",
        data: classData,
      });
    },
  );

  /**
   * PERMANENT DELETE CLASS
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
            "Invalid class ID",
            400,
          ),
        );
      }

      const success =
        await ClassModel.hardDelete(id);

      if (!success) {
        return next(
          new AppError(
            "Class not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Class permanently deleted",
        data: {
          id,
        },
      });
    },
  );
}