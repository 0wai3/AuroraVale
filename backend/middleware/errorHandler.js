function errorHandler(error, req, res, next) {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(error.status || 500).json({
        success: false,
        message: error.status
            ? error.message
            : "An unexpected server error occurred."
    });
}

module.exports = errorHandler;