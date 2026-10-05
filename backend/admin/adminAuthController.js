const crypto = require("crypto");

const activeTokens = new Set();

function login(req, res) {

    const {
        username,
        password
    } = req.body;

    if (!username || !password) {

        return res.status(400).json({
            success: false,
            message:
                "Username and password are required."
        });

    }

    const configuredUsername =
        process.env.ADMIN_USERNAME;

    const configuredPassword =
        process.env.ADMIN_PASSWORD;

    if (
        !configuredUsername ||
        !configuredPassword
    ) {

        return res.status(500).json({
            success: false,
            message:
                "Admin authentication is not configured."
        });

    }

    if (
        username.trim() !==
        configuredUsername ||
        password !==
        configuredPassword
    ) {

        return res.status(401).json({
            success: false,
            message:
                "Invalid admin credentials."
        });

    }

    const token =
        crypto.randomBytes(48).toString("hex");

    activeTokens.add(token);

    return res.json({
        success: true,
        message:
            "Admin login successful.",
        token
    });
}


function logout(req, res) {

    const authorization =
        req.headers.authorization || "";

    if (
        authorization.startsWith(
            "Bearer "
        )
    ) {

        const token =
            authorization.substring(7);

        activeTokens.delete(token);

    }

    return res.json({
        success: true,
        message:
            "Admin logged out successfully."
    });
}


function getSession(req, res) {

    const authorization =
        req.headers.authorization || "";

    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        return res.status(401).json({
            success: false,
            authenticated: false
        });

    }

    const token =
        authorization.substring(7);

    if (!activeTokens.has(token)) {

        return res.status(401).json({
            success: false,
            authenticated: false
        });

    }

    return res.json({
        success: true,
        authenticated: true
    });
}


function isValidToken(token) {

    return activeTokens.has(token);

}


module.exports = {
    login,
    logout,
    getSession,
    isValidToken
};