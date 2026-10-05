const express = require("express");

const {
    getApplications,
    getApplicationById,
    getPaymentScreenshot,
    updateApplicationStatus
} = require("../admin/adminController");

const requireAdmin =
    require("../middleware/adminAuth");

const router =
    express.Router();

router.use(
    requireAdmin
);

router.get(
    "/applications",
    getApplications
);

router.get(
    "/applications/:id",
    getApplicationById
);

router.get(
    "/applications/:id/payment-screenshot",
    getPaymentScreenshot
);

router.patch(
    "/applications/:id/status",
    updateApplicationStatus
);

module.exports =
    router;