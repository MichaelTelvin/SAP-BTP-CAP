
module.exports = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err.status || 500;
    console.error('EXPRESS ERROR:', err.stack);
    res.status(status).json({
        error: status === 503
            ? err.message
            : status >= 500
                ? 'Internal server error'
                : err.message
    });
};

