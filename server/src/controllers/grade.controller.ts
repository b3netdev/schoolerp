import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  GradeModel,
  GradePayload,
  GradeStatus,
} from "../models/Grade.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const positiveInteger = (
  value: unknown,
): number | null => {
  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  const numberValue = Number(value);

  if (
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
};

const optionalNumber = (
  value: unknown,
): number | null => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue = Number(value);

  if (
    !Number.isInteger(numberValue) ||
    numberValue < 0
  ) {
    throw new AppError(
      "Mark ranges must be positive whole numbers.",
      400,
    );
  }

  return numberValue;
};

const normalizeGrade = (
  data: Record<string, unknown>,
  classId: number,
): GradePayload => {
  const grade = String(
    data.grade ?? "",
  )
    .trim()
    .replace(/\s+/g, " ");

  if (!grade) {
    throw new AppError(
      "Grade is required.",
      400,
    );
  }

  if (grade.length > 10) {
    throw new AppError(
      "Grade cannot exceed 10 characters.",
      400,
    );
  }

  const rangeFrom = optionalNumber(
    data.range_from,
  );

  const rangeTo = optionalNumber(
    data.range_to,
  );

  if (
    rangeFrom !== null &&
    rangeTo !== null &&
    rangeFrom > rangeTo
  ) {
    throw new AppError(
      `Range From cannot be greater than Range To for grade ${grade}.`,
      400,
    );
  }

  return {
    grade,
    class_id: classId,
    range_from: rangeFrom,
    range_to: rangeTo,
    remarks:
      String(data.remarks ?? "").trim() ||
      null,
    description:
      String(data.description ?? "").trim() ||
      null,
  };
};

export const getGrades = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const status = String(
      req.query.status || "active",
    ) as GradeStatus;

    if (
      !["active", "trash", "all"].includes(
        status,
      )
    ) {
      return next(
        new AppError(
          "Invalid grade status.",
          400,
        ),
      );
    }

    let classId: number | undefined;

    if (req.query.class_id) {
      const parsedClassId =
        positiveInteger(
          req.query.class_id,
        );

      if (!parsedClassId) {
        return next(
          new AppError(
            "Invalid class ID.",
            400,
          ),
        );
      }

      classId = parsedClassId;
    }

    const grades = await GradeModel.findAll(
      classId,
      status,
    );

    res.status(200).json({
      success: true,
      message:
        "Grades fetched successfully.",
      data: grades,
    });
  },
);

export const addGradesBulk = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const classId = positiveInteger(
      req.body.class_id,
    );

    if (!classId) {
      return next(
        new AppError(
          "Please select a valid class.",
          400,
        ),
      );
    }

    const classExists =
      await GradeModel.classExists(classId);

    if (!classExists) {
      return next(
        new AppError(
          "Selected class does not exist.",
          404,
        ),
      );
    }

    if (!Array.isArray(req.body.grades)) {
      return next(
        new AppError(
          "Grades must be sent as an array.",
          400,
        ),
      );
    }

    if (
      req.body.grades.length === 0 ||
      req.body.grades.length > 30
    ) {
      return next(
        new AppError(
          "Please add between 1 and 30 grades.",
          400,
        ),
      );
    }

    const grades = req.body.grades.map(
      (item: Record<string, unknown>) =>
        normalizeGrade(item, classId),
    );

    const gradeNames = new Set<string>();

    for (const item of grades) {
      const gradeName =
        item.grade.toLowerCase();

      if (gradeNames.has(gradeName)) {
        return next(
          new AppError(
            `Duplicate grade "${item.grade}" found in the submitted list.`,
            409,
          ),
        );
      }

      gradeNames.add(gradeName);

      const duplicate =
        await GradeModel.findDuplicate(
          item.grade,
          classId,
        );

      if (duplicate) {
        return next(
          new AppError(
            `Grade "${item.grade}" already exists for this class.`,
            409,
          ),
        );
      }
    }

    const createdGrades =
      await GradeModel.createBulk(grades);

    res.status(201).json({
      success: true,
      message:
        "Grades added successfully.",
      data: createdGrades,
    });
  },
);

export const updateGrade = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const id = positiveInteger(
      req.params.id,
    );

    if (!id) {
      return next(
        new AppError(
          "Invalid grade ID.",
          400,
        ),
      );
    }

    const currentGrade =
      await GradeModel.findById(id);

    if (!currentGrade) {
      return next(
        new AppError(
          "Grade not found.",
          404,
        ),
      );
    }

    const classId = positiveInteger(
      req.body.class_id ??
        currentGrade.class_id,
    );

    if (!classId) {
      return next(
        new AppError(
          "Please select a valid class.",
          400,
        ),
      );
    }

    const payload = normalizeGrade(
      {
        grade:
          req.body.grade ??
          currentGrade.grade,
        range_from:
          req.body.range_from ??
          currentGrade.range_from,
        range_to:
          req.body.range_to ??
          currentGrade.range_to,
        remarks:
          req.body.remarks ??
          currentGrade.remarks,
        description:
          req.body.description ??
          currentGrade.description,
      },
      classId,
    );

    const duplicate =
      await GradeModel.findDuplicate(
        payload.grade,
        classId,
        id,
      );

    if (duplicate) {
      return next(
        new AppError(
          `Grade "${payload.grade}" already exists for this class.`,
          409,
        ),
      );
    }

    const updatedGrade =
      await GradeModel.update(
        id,
        payload,
      );

    res.status(200).json({
      success: true,
      message:
        "Grade updated successfully.",
      data: updatedGrade,
    });
  },
);

export const deleteGrade = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const id = positiveInteger(
      req.params.id,
    );

    if (!id) {
      return next(
        new AppError(
          "Invalid grade ID.",
          400,
        ),
      );
    }

    const grade =
      await GradeModel.softDelete(id);

    if (!grade) {
      return next(
        new AppError(
          "Grade not found or already deleted.",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Grade moved to trash.",
      data: grade,
    });
  },
);

export const restoreGrade = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const id = positiveInteger(
      req.params.id,
    );

    if (!id) {
      return next(
        new AppError(
          "Invalid grade ID.",
          400,
        ),
      );
    }

    const grade =
      await GradeModel.restore(id);

    if (!grade) {
      return next(
        new AppError(
          "Trashed grade not found.",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Grade restored successfully.",
      data: grade,
    });
  },
);

export const hardDeleteGrade = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const id = positiveInteger(
      req.params.id,
    );

    if (!id) {
      return next(
        new AppError(
          "Invalid grade ID.",
          400,
        ),
      );
    }

    const grade =
      await GradeModel.hardDelete(id);

    if (!grade) {
      return next(
        new AppError(
          "Trashed grade not found.",
          404,
        ),
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Grade permanently deleted.",
      data: grade,
    });
  },
);