import {
    NextFunction,
    Request,
    Response,
} from "express";

import fs from "fs/promises";
import path from "path";

import { ProfileModel } from "../models/Profile.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";


const getUserId = (
    req: Request,
): number | null => {
    const userId = Number(
        req.user?.id,
    );

    if (
        !Number.isInteger(userId) ||
        userId <= 0
    ) {
        return null;
    }

    return userId;
};

const deleteProfileFile = async (
    profileImage: string | null,
): Promise<void> => {
    if (!profileImage) {
        return;
    }

    try {

        const fileName =
            path.basename(
                profileImage,
            );

        const filePath = path.join(
            process.cwd(),
            "uploads",
            "profiles",
            fileName,
        );

        await fs.unlink(filePath);
    } catch (error: any) {

        if (
            error?.code !== "ENOENT"
        ) {
            console.error(
                "Failed to delete profile image:",
                error,
            );
        }
    }
};

export class ProfileController {

    static getProfile = catchAsync(
        async (
            req: Request,
            res: Response,
            next: NextFunction,
        ) => {
            const userId =
                getUserId(req);

            if (!userId) {
                return next(
                    new AppError(
                        "Unauthorized. Please login first.",
                        401,
                    ),
                );
            }

            const profile =
                await ProfileModel.findByUserId(
                    userId,
                );

            if (!profile) {
                return next(
                    new AppError(
                        "Profile not found",
                        404,
                    ),
                );
            }

            res.status(200).json({
                success: true,
                message:
                    "Profile fetched successfully",
                data: profile,
            });
        },
    );


    static updateProfile =
        catchAsync(
            async (
                req: Request,
                res: Response,
                next: NextFunction,
            ) => {
                const userId =
                    getUserId(req);

                if (!userId) {
                    return next(
                        new AppError(
                            "Unauthorized. Please login first.",
                            401,
                        ),
                    );
                }

                const {
                    name,
                    email,
                } = req.body;


                if (
                    name === undefined &&
                    email === undefined
                ) {
                    return next(
                        new AppError(
                            "No profile data provided to update",
                            400,
                        ),
                    );
                }

                const payload: {
                    name?: string;
                    email?: string;
                } = {};


                if (
                    name !== undefined
                ) {
                    const cleanName =
                        String(name).trim();

                    if (!cleanName) {
                        return next(
                            new AppError(
                                "Name cannot be empty",
                                400,
                            ),
                        );
                    }

                    payload.name =
                        cleanName;
                }


                if (
                    email !== undefined
                ) {
                    const cleanEmail =
                        String(email)
                            .trim()
                            .toLowerCase();

                    if (!cleanEmail) {
                        return next(
                            new AppError(
                                "Email cannot be empty",
                                400,
                            ),
                        );
                    }

                    const emailRegex =
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    if (
                        !emailRegex.test(
                            cleanEmail,
                        )
                    ) {
                        return next(
                            new AppError(
                                "Please provide a valid email address",
                                400,
                            ),
                        );
                    }

                    payload.email =
                        cleanEmail;
                }

                const profile =
                    await ProfileModel.updateProfile(
                        userId,
                        payload,
                    );

                if (!profile) {
                    return next(
                        new AppError(
                            "Profile not found",
                            404,
                        ),
                    );
                }

                res.status(200).json({
                    success: true,
                    message:
                        "Profile updated successfully",
                    data: profile,
                });
            },
        );

    /**
     * UPLOAD / REPLACE PROFILE IMAGE
     *
     * Required middleware:
     *
     * profileUpload.single("profile_image")
     */
    static uploadProfileImage =
        catchAsync(
            async (
                req: Request,
                res: Response,
                next: NextFunction,
            ) => {
                const userId =
                    getUserId(req);

                /**
                 * If somehow unauthorized after
                 * multer saved the file,
                 * clean that file.
                 */
                if (!userId) {
                    if (req.file) {
                        await deleteProfileFile(
                            `/uploads/profiles/${req.file.filename}`,
                        );
                    }

                    return next(
                        new AppError(
                            "Unauthorized. Please login first.",
                            401,
                        ),
                    );
                }

                /**
                 * No uploaded file.
                 */
                if (!req.file) {
                    return next(
                        new AppError(
                            "Profile picture is required",
                            400,
                        ),
                    );
                }


                const oldProfileImage =
                    await ProfileModel.getProfileImage(
                        userId,
                    );


                const profileImage =
                    `/uploads/profiles/${req.file.filename}`;

                const profile =
                    await ProfileModel.updateProfileImage(
                        userId,
                        profileImage,
                    );


                if (!profile) {
                    await deleteProfileFile(
                        profileImage,
                    );

                    return next(
                        new AppError(
                            "Profile not found",
                            404,
                        ),
                    );
                }


                if (
                    oldProfileImage &&
                    oldProfileImage !==
                    profileImage
                ) {
                    await deleteProfileFile(
                        oldProfileImage,
                    );
                }

                res.status(200).json({
                    success: true,
                    message:
                        "Profile picture updated successfully",
                    data: profile,
                });
            },
        );


    static removeProfileImage =
        catchAsync(
            async (
                req: Request,
                res: Response,
                next: NextFunction,
            ) => {
                const userId =
                    getUserId(req);

                if (!userId) {
                    return next(
                        new AppError(
                            "Unauthorized. Please login first.",
                            401,
                        ),
                    );
                }


                const currentProfileImage =
                    await ProfileModel.getProfileImage(
                        userId,
                    );

                const profile =
                    await ProfileModel.removeProfileImage(
                        userId,
                    );

                if (!profile) {
                    return next(
                        new AppError(
                            "Profile not found",
                            404,
                        ),
                    );
                }


                if (
                    currentProfileImage
                ) {
                    await deleteProfileFile(
                        currentProfileImage,
                    );
                }

                res.status(200).json({
                    success: true,
                    message:
                        "Profile picture removed successfully",
                    data: profile,
                });
            },
        );
}