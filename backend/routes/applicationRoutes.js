const express = require("express");

const {
    createApplication,
    getApplication
} = require("../controllers/applicationController");

const pool = require("../config/database");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Create Application
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    createApplication
);


/*
|--------------------------------------------------------------------------
| Check Application Status
|--------------------------------------------------------------------------
*/

router.post(
    "/status",
    async (req, res, next) => {

        try {

            const applicationNumber =
                typeof req.body.applicationNumber === "string"
                    ? req.body.applicationNumber.trim()
                    : "";

            const email =
                typeof req.body.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "";


            if (
                !applicationNumber ||
                !email
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Application number and email are required."
                });

            }


            const result =
                await pool.query(
                    `
                    SELECT
                        application_number,
                        full_name,
                        country,
                        city,
                        email,
                        preferred_destination,
                        email_verified,
                        payment_status,
                        participant_status,
                        selection_status,
                        created_at,
                        updated_at
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

                return res.status(404).json({
                    success: false,
                    message:
                        "No application was found with those details."
                });

            }


            const application =
                result.rows[0];


            return res.json({

                success: true,

                application: application

            });

        } catch (error) {

            next(error);

        }

    }
);


/*
|--------------------------------------------------------------------------
| Get Application
|--------------------------------------------------------------------------
*/

router.get(
    "/:applicationNumber",
    getApplication
);


module.exports = router;