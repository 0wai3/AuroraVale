const {
    isValidToken
} = require("../admin/adminAuthController");


function requireAdmin(req, res, next) {

    const authorization =
        req.headers.authorization || "";


    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        return res.status(401).json({
            success: false,
            message:
                "Admin authentication required."
        });

    }


    const token =
        authorization.substring(7);


    if (!isValidToken(token)) {

        return res.status(401).json({
            success: false,
            message:
                "Admin authentication required."
        });

    }


    next();

}


module.exports =
    requireAdmin;