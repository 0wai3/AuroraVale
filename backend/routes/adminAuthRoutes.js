const express = require("express");

const {
    login,
    logout,
    getSession
} = require("../admin/adminAuthController");

const router =
    express.Router();


router.post(
    "/login",
    login
);


router.post(
    "/logout",
    logout
);


router.get(
    "/session",
    getSession
);


module.exports =
    router;