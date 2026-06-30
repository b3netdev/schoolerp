import { Request, Response, NextFunction } from "express";
import { SettingsModel } from "../models/settings.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";



export class SettingsController {
  // Create setting
  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, setting_group, key, type, value } = req.body;

      if (!name || !setting_group || !key || !type) {
        return next(
          new AppError(
            "name, setting_group, key and type are required.",
            400
          )
        );
      }

      const existingSetting = await SettingsModel.findByKey(key);

      if (existingSetting) {
        return next(new AppError("Setting key already exists.", 400));
      }

      const setting = await SettingsModel.create({
        name,
        setting_group,
        key,
        type,
        value,
      });

      res.status(201).json({
        success: true,
        message: "Setting created successfully.",
        data: setting,
      });
    }
  );

  // Get all settings
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const settings = await SettingsModel.findAll();

      res.status(200).json({
        success: true,
        count: settings.length,
        data: settings,
      });
    }
  );

  // Get single setting by ID
  static getById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const setting = await SettingsModel.findById(Number(id));

      if (!setting) {
        return next(new AppError("Setting not found.", 404));
      }

      res.status(200).json({
        success: true,
        data: setting,
      });
    }
  );

  // Get setting by key
  static getByKey = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { key } = req.body;

      const setting = await SettingsModel.findByKey(key);

      if (!setting) {
        return next(new AppError("Setting not found.", 404));
      }

      res.status(200).json({
        success: true,
        data: setting,
      });
    }
  );

  // Get settings by group
  static getByGroup = catchAsync(async (req: Request,res: Response,next: NextFunction) => {
      const setting_group : string  = req.body.setting_group;

      const settings = await SettingsModel.findByGroup(setting_group);

      res.status(200).json({
        success: true,
        count: settings.length,
        data: settings,
      });
    }
  );

  // Update setting
  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const setting = await SettingsModel.findById(Number(id));

      if (!setting) {
        return next(new AppError("Setting not found.", 404));
      }

      const updatedSetting = await SettingsModel.update(Number(id), req.body);

      res.status(200).json({
        success: true,
        message: "Setting updated successfully.",
        data: updatedSetting,
      });
    }
  );

  // Soft delete setting
  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const setting = await SettingsModel.findById(Number(id));

      if (!setting) {
        return next(new AppError("Setting not found.", 404));
      }

      await SettingsModel.delete(Number(id));

      res.status(200).json({
        success: true,
        message: "Setting deleted successfully.",
      });
    }
  );
  

  // Hard delete setting
  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const deleted = await SettingsModel.hardDelete(Number(id));

      if (!deleted) {
        return next(new AppError("Setting not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Setting permanently deleted successfully.",
      });
    }
  );
}