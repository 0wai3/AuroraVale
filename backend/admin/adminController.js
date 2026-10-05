const fs = require("fs");
const path = require("path");

const pool = require("../config/database");

const {
    sendPaymentVerifiedEmail,
    sendPaymentRejectedEmail
} = require("../services/emailService");

async function getApplications(req, res, next) {
    try {
        const result = await pool.query(`
            SELECT
                id,
                application_number,
                full_name,
                country,
                city,
                email,
                phone,
                organization_name,
                organization_type,
                representative_role,
                preferred_destination,
                passport_status,
                email_verified,
                payment_status,
                payment_amount_cents,
                payment_currency,
                payment_screenshot_filename,
                payment_screenshot_original_name,
                payment_screenshot_mime_type,
                payment_screenshot_uploaded_at,
                participant_status,
                selection_status,
                created_at,
                updated_at
            FROM applications
            ORDER BY created_at DESC
        `);

        return res.json({
            success: true,
            applications: result.rows
        });

    } catch (error) {
        next(error);
    }
}

async function getApplicationById(req, res, next) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                *
            FROM applications
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        return res.json({
            success: true,
            application: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
}

async function getPaymentScreenshot(req, res, next) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                payment_screenshot_filename,
                payment_screenshot_mime_type
            FROM applications
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        const application =
            result.rows[0];

        if (
            !application.payment_screenshot_filename
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "No payment screenshot has been uploaded."
            });
        }

        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (
            !allowedMimeTypes.includes(
                application.payment_screenshot_mime_type
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Unsupported payment screenshot type."
            });
        }

        const uploadsDirectory =
            path.resolve(
                __dirname,
                "..",
                "uploads",
                "payment-screenshots"
            );

        const filename =
            path.basename(
                application.payment_screenshot_filename
            );

        const filePath =
            path.join(
                uploadsDirectory,
                filename
            );

        if (
            !fs.existsSync(filePath)
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment screenshot file could not be found."
            });
        }

        res.setHeader(
            "Content-Type",
            application.payment_screenshot_mime_type
        );

        res.setHeader(
            "Cache-Control",
            "private, no-store"
        );

        return res.sendFile(
            filePath
        );

    } catch (error) {
        next(error);
    }
}

async function updateApplicationStatus(req, res, next) {
    try {
        const { id } = req.params;

        const {
            participantStatus,
            selectionStatus,
            paymentStatus
        } = req.body;

        const validParticipantStatuses = [
            "application_pending",
            "payment_pending",
            "participant",
            "completed"
        ];

        const validSelectionStatuses = [
            "not_selected",
            "under_review",
            "selected",
            "declined"
        ];

        const validPaymentStatuses = [
            "pending",
            "screenshot_received",
            "verified",
            "rejected"
        ];

        if (
            participantStatus &&
            !validParticipantStatuses.includes(
                participantStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid participant status."
            });
        }

        if (
            selectionStatus &&
            !validSelectionStatuses.includes(
                selectionStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid selection status."
            });
        }

        if (
            paymentStatus &&
            !validPaymentStatuses.includes(
                paymentStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment status."
            });
        }

        const currentResult =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    application_number,
                    payment_status,
                    participant_status,
                    selection_status
                FROM applications
                WHERE id = $1
                `,
                [id]
            );

        if (
            currentResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found."
            });
        }

        const current =
            currentResult.rows[0];

        let finalParticipantStatus =
            participantStatus || null;

        if (
            paymentStatus === "verified" &&
            !participantStatus
        ) {
            finalParticipantStatus =
                "participant";
        }

        if (
            paymentStatus === "rejected" &&
            !participantStatus
        ) {
            finalParticipantStatus =
                "payment_pending";
        }

        const result =
            await pool.query(
                `
                UPDATE applications
                SET
                    participant_status =
                        COALESCE($1, participant_status),

                    selection_status =
                        COALESCE($2, selection_status),

                    payment_status =
                        COALESCE($3, payment_status),

                    updated_at = NOW()

                WHERE id = $4

                RETURNING
                    id,
                    application_number,
                    full_name,
                    email,
                    payment_status,
                    participant_status,
                    selection_status,
                    updated_at
                `,
                [
                    finalParticipantStatus,
                    selectionStatus || null,
                    paymentStatus || null,
                    id
                ]
            );

        const updated =
            result.rows[0];

        if (
            paymentStatus === "verified" &&
            current.payment_status !== "verified"
        ) {
            try {
                await sendPaymentVerifiedEmail(
                    updated.email,
                    updated.full_name,
                    updated.application_number
                );
            } catch (emailError) {
                console.error(
                    "Payment verification email failed:",
                    emailError
                );
            }
        }

        if (
            paymentStatus === "rejected" &&
            current.payment_status !== "rejected"
        ) {
            try {
                await sendPaymentRejectedEmail(
                    updated.email,
                    updated.full_name,
                    updated.application_number
                );
            } catch (emailError) {
                console.error(
                    "Payment rejection email failed:",
                    emailError
                );
            }
        }

        return res.json({
            success: true,
            message:
                "Application status updated successfully.",
            application: updated
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    getApplications,
    getApplicationById,
    getPaymentScreenshot,
    updateApplicationStatus
};