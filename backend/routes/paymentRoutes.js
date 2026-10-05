const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    uploadPaymentScreenshot
} = require("../controllers/paymentScreenshotController");

const router = express.Router();

const temporaryUploadDirectory =
    path.join(
        __dirname,
        "..",
        "uploads",
        "temporary"
    );

if (
    !fs.existsSync(
        temporaryUploadDirectory
    )
) {
    fs.mkdirSync(
        temporaryUploadDirectory,
        {
            recursive: true
        }
    );
}

const storage =
    multer.diskStorage({

        destination: (
            req,
            file,
            callback
        ) => {

            callback(
                null,
                temporaryUploadDirectory
            );
        },

        filename: (
            req,
            file,
            callback
        ) => {

            const extension =
                path.extname(
                    file.originalname
                ).toLowerCase();

            callback(
                null,
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 12)}${extension}`
            );
        }
    });

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const upload =
    multer({

        storage,

        limits: {
            fileSize: 5 * 1024 * 1024
        },

        fileFilter: (
            req,
            file,
            callback
        ) => {

            if (
                allowedMimeTypes.includes(
                    file.mimetype
                )
            ) {
                callback(
                    null,
                    true
                );

                return;
            }

            callback(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )
            );
        }
    });

router.get(
    "/status",
    (req, res) => {

        res.json({
            success: true,
            message:
                "Payment system is ready."
        });

    }
);

router.post(
    "/screenshot",
    upload.single("paymentScreenshot"),
    uploadPaymentScreenshot
);

module.exports = router;