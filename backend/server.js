require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const applicationRoutes = require("./routes/applicationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    })
);

app.use(
    cors({
        origin: [
            "http://127.0.0.1:5500",
            "http://localhost:5500"
        ],
        methods: ["GET", "POST", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(
    express.json({
        limit: "100kb"
    })
);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        service: "AuroraVale API",
        status: "online"
    });
});

app.use(
    "/api/applications",
    applicationRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/verification",
    verificationRoutes
);

app.use(
    "/api/admin/auth",
    adminAuthRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(
        `AuroraVale API running on http://127.0.0.1:${PORT}`
    );
});