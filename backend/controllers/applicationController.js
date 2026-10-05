const crypto = require("crypto");
const pool = require("../config/database");

const TEST_EMAIL =
    "alimuzamil172000@gmail.com";

function createApplicationNumber() {
    const timestamp =
        Date.now().toString(36).toUpperCase();

    const random =
        crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

    return `AV-${timestamp}-${random}`;
}

function clean(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

async function createApplication(req, res, next) {
    try {
        const {
            fullName,
            country,
            city,
            email,
            phone,
            organizationName,
            organizationType,
            role,
            destination,
            passportStatus,
            purpose,
            organizationInfo,
            additional
        } = req.body;

        const requiredFields = {
            fullName,
            country,
            city,
            email,
            phone,
            destination,
            passportStatus,
            purpose
        };

        for (
            const [field, value]
            of Object.entries(requiredFields)
        ) {
            if (!clean(value)) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${field} is required.`
                });
            }
        }

        const normalizedEmail =
            clean(email).toLowerCase();

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address."
            });
        }

        const applicationNumber =
            createApplicationNumber();

        const isTestEmail =
            normalizedEmail === TEST_EMAIL;

        if (isTestEmail) {
            const existingResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        application_number
                    FROM applications
                    WHERE LOWER(email) = $1
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [TEST_EMAIL]
                );

            if (existingResult.rows.length > 0) {
                const existingApplication =
                    existingResult.rows[0];

                await pool.query(
                    `
                    DELETE FROM email_verification_codes
                    WHERE application_id = $1
                    `,
                    [existingApplication.id]
                );

                const updateQuery = `
                    UPDATE applications
                    SET
                        application_number = $1,
                        full_name = $2,
                        country = $3,
                        city = $4,
                        email = $5,
                        phone = $6,
                        organization_name = $7,
                        organization_type = $8,
                        representative_role = $9,
                        preferred_destination = $10,
                        passport_status = $11,
                        participation_reason = $12,
                        organization_information = $13,
                        additional_information = $14,
                        email_verified = FALSE,
                        payment_status = 'pending',
                        participant_status = 'application_pending',
                        selection_status = 'not_selected',
                        payment_screenshot_filename = NULL,
                        payment_screenshot_original_name = NULL,
                        payment_screenshot_mime_type = NULL,
                        payment_screenshot_uploaded_at = NULL,
                        payment_screenshot_path = NULL,
                        updated_at = NOW()
                    WHERE id = $15
                    RETURNING
                        id,
                        application_number,
                        payment_status,
                        participant_status,
                        created_at
                `;

                const updateValues = [
                    applicationNumber,
                    clean(fullName),
                    clean(country),
                    clean(city),
                    normalizedEmail,
                    clean(phone),
                    clean(organizationName),
                    clean(organizationType),
                    clean(role),
                    clean(destination),
                    clean(passportStatus),
                    clean(purpose),
                    clean(organizationInfo),
                    clean(additional),
                    existingApplication.id
                ];

                const updatedResult =
                    await pool.query(
                        updateQuery,
                        updateValues
                    );

                return res.status(201).json({
                    success: true,
                    message:
                        "Test application created successfully.",
                    testMode: true,
                    application:
                        updatedResult.rows[0]
                });
            }
        }

        const existingApplication =
            await pool.query(
                `
                SELECT
                    application_number
                FROM applications
                WHERE LOWER(email) = $1
                LIMIT 1
                `,
                [normalizedEmail]
            );

        if (existingApplication.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code:
                    "EMAIL_ALREADY_USED",
                message:
                    "An application with this email address has already been submitted. Please check your application status using your email address and application number.",
                applicationNumber:
                    existingApplication
                        .rows[0]
                        .application_number
            });
        }

        const query = `
            INSERT INTO applications (
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
                participation_reason,
                organization_information,
                additional_information
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14
            )
            RETURNING
                id,
                application_number,
                payment_status,
                participant_status,
                created_at
        `;

        const values = [
            applicationNumber,
            clean(fullName),
            clean(country),
            clean(city),
            normalizedEmail,
            clean(phone),
            clean(organizationName),
            clean(organizationType),
            clean(role),
            clean(destination),
            clean(passportStatus),
            clean(purpose),
            clean(organizationInfo),
            clean(additional)
        ];

        const result =
            await pool.query(
                query,
                values
            );

        return res.status(201).json({
            success: true,
            message:
                "Application received successfully.",
            application:
                result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                code:
                    "EMAIL_ALREADY_USED",
                message:
                    "An application with this email address has already been submitted. Please check your application status using your email address and application number."
            });
        }

        next(error);
    }
}

async function getApplication(
    req,
    res,
    next
) {
    try {
        const {
            applicationNumber
        } = req.params;

        const result =
            await pool.query(
                `
                SELECT
                    application_number,
                    full_name,
                    country,
                    city,
                    email,
                    organization_name,
                    organization_type,
                    representative_role,
                    preferred_destination,
                    email_verified,
                    payment_status,
                    participant_status,
                    selection_status,
                    created_at,
                    updated_at
                FROM applications
                WHERE application_number = $1
                `,
                [applicationNumber]
            );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found."
            });
        }

        return res.json({
            success: true,
            application:
                result.rows[0]
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createApplication,
    getApplication
};