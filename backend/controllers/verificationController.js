const crypto = require("crypto");
const pool = require("../config/database");

const {
    sendVerificationCode,
    sendPaymentInstructionsEmail
} = require("../services/emailService");

function clean(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function generateCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashCode(code) {
    return crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");
}

async function sendVerificationCodeToApplicant(req, res, next) {
    try {
        const applicationNumber =
            clean(req.params.applicationNumber);

        const result = await pool.query(
            `
            SELECT
                id,
                full_name,
                email,
                email_verified
            FROM applications
            WHERE application_number = $1
            `,
            [applicationNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        const application = result.rows[0];

        if (application.email_verified) {
            return res.status(400).json({
                success: false,
                message:
                    "This email address is already verified."
            });
        }

        await pool.query(
            `
            DELETE FROM email_verification_codes
            WHERE application_id = $1
            `,
            [application.id]
        );

        const code = generateCode();
        const codeHash = hashCode(code);

        await pool.query(
            `
            INSERT INTO email_verification_codes (
                application_id,
                code_hash,
                expires_at
            )
            VALUES (
                $1,
                $2,
                NOW() + INTERVAL '10 minutes'
            )
            `,
            [application.id, codeHash]
        );

        await sendVerificationCode(
            application.email,
            code,
            application.full_name
        );

        return res.json({
            success: true,
            message:
                "Verification code sent to your email."
        });

    } catch (error) {
        next(error);
    }
}

async function verifyEmail(req, res, next) {
    try {
        const applicationNumber =
            clean(req.params.applicationNumber);

        const code =
            clean(req.body.code);

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter the 6-digit verification code."
            });
        }

        const applicationResult =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    application_number,
                    email_verified
                FROM applications
                WHERE application_number = $1
                `,
                [applicationNumber]
            );

        if (applicationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found."
            });
        }

        const application =
            applicationResult.rows[0];

        if (application.email_verified) {
            return res.json({
                success: true,
                message:
                    "Email is already verified.",
                nextStep: "payment"
            });
        }

        const verificationResult =
            await pool.query(
                `
                SELECT
                    id,
                    code_hash,
                    expires_at,
                    attempts
                FROM email_verification_codes
                WHERE application_id = $1
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [application.id]
            );

        if (verificationResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No active verification code was found."
            });
        }

        const verification =
            verificationResult.rows[0];

        if (verification.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new code."
            });
        }

        if (
            new Date(verification.expires_at) <
            new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This verification code has expired. Please request a new code."
            });
        }

        const submittedHash =
            hashCode(code);

        if (
            submittedHash !==
            verification.code_hash
        ) {
            await pool.query(
                `
                UPDATE email_verification_codes
                SET attempts = attempts + 1
                WHERE id = $1
                `,
                [verification.id]
            );

            return res.status(400).json({
                success: false,
                message:
                    "Incorrect verification code."
            });
        }

        await pool.query(
            `
            UPDATE applications
            SET
                email_verified = TRUE,
                participant_status = 'payment_pending',
                updated_at = NOW()
            WHERE id = $1
            `,
            [application.id]
        );

        await pool.query(
            `
            UPDATE email_verification_codes
            SET used_at = NOW()
            WHERE id = $1
            `,
            [verification.id]
        );

        let paymentEmailSent = false;

        try {
            await sendPaymentInstructionsEmail(
                application.email,
                application.full_name,
                application.application_number
            );

            paymentEmailSent = true;

        } catch (emailError) {
            console.error(
                "Payment instruction email failed:",
                emailError
            );
        }

        return res.json({
            success: true,
            message:
                "Email verified successfully.",
            nextStep: "payment",
            paymentEmailSent
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    sendVerificationCodeToApplicant,
    verifyEmail
};