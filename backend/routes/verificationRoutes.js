const express = require("express");

const {
    sendVerificationCodeToApplicant,
    verifyEmail
} = require("../controllers/verificationController");

const router = express.Router();

router.post(
    "/:applicationNumber/send",
    sendVerificationCodeToApplicant
);

router.post(
    "/:applicationNumber/verify",
    verifyEmail
);

module.exports = router;