import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDir = path.join(
    process.cwd(),
    "uploads",
    "profiles",
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true,
    });
}

const storage = multer.diskStorage({
    destination: (
        req,
        file,
        callback,
    ) => {
        callback(null, uploadDir);
    },

    filename: (
        req,
        file,
        callback,
    ) => {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        callback(null, fileName);
    },
});

const fileFilter: multer.Options["fileFilter"] = (
    req,
    file,
    callback,
) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return callback(
            new Error(
                "Only JPG, PNG and WEBP images are allowed",
            ),
        );
    }

    callback(null, true);
};

export const profileUpload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter,
});