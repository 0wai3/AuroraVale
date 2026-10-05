const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const pool = require("../config/database");

function clean(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

async function uploadPaymentScreenshot(req, res, next) {
    try {
        const applicationNumber =
            clean(req.body.applicationNumber);

        const email =
            clean(req.body.email).toLowerCase();

        if (!applicationNumber || !email) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                success: false,
                message:
                    "Application number and email are required."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a payment screenshot."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                application_number,
                full_name,
                email,
                email_verified,
                payment_status
            FROM applications
            WHERE
                application_number = $1
                AND email = $2
            `,
            [
                applicationNumber,
                email
            ]
        );

        if (result.rows.length === 0) {
            fs.unlinkSync(req.file.path);

            return res.status(404).json({
                success: false,
                message:
                    "No application was found with those details."
            });
        }

        const application =
            result.rows[0];

        if (!application.email_verified) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message:
                    "Please verify your email before submitting payment confirmation."
            });
        }

        if (
            application.payment_status ===
            "verified"
        ) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message:
                    "This payment has already been verified."
            });
        }

        const extension =
            path.extname(
                req.file.originalname
            ).toLowerCase();

        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ];

        if (
            !allowedExtensions.includes(
                extension
            )
        ) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message:
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
            });
        }

        const uploadsDirectory =
            path.join(
                __dirname,
                "..",
                "uploads",
                "payment-screenshots"
            );

        if (
            !fs.existsSync(
                uploadsDirectory
            )
        ) {
            fs.mkdirSync(
                uploadsDirectory,
                {
                    recursive: true
                }
            );
        }

        const uniqueName =
            `${crypto.randomUUID()}${extension}`;

        const finalPath =
            path.join(
                uploadsDirectory,
                uniqueName
            );

        fs.renameSync(
            req.file.path,
            finalPath
        );

        const relativePath =
            path.join(
                "uploads",
                "payment-screenshots",
                uniqueName
            );

        await pool.query(
            `
            UPDATE applications
            SET
                payment_screenshot_filename = $1,
                payment_screenshot_original_name = $2,
                payment_screenshot_mime_type = $3,
                payment_screenshot_uploaded_at = NOW(),
                payment_screenshot_path = $4,
                payment_status = 'screenshot_received',
                updated_at = NOW()
            WHERE id = $5
            `,
            [
                uniqueName,
                req.file.originalname,
                req.file.mimetype,
                relativePath,
                application.id
            ]
        );

        return res.json({
            success: true,
            message:
                "Payment screenshot received successfully.",
            applicationNumber:
                application.application_number,
            paymentStatus:
                "screenshot_received"
        });

    } catch (error) {

        if (
            req.file &&
            fs.existsSync(req.file.path)
        ) {
            try {
                fs.unlinkSync(
                    req.file.path
                );
            } catch (cleanupError) {
                console.error(
                    "File cleanup failed:",
                    cleanupError
                );
            }
        }

        next(error);
    }
}

module.exports = {
    uploadPaymentScreenshot
};