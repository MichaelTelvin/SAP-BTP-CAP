const { randomUUID } = require('node:crypto');
const { requestContext } = require('../logger.js');

module.exports = function correlationMiddleware(req, res, next) {
    const incoming = req.get('x-correlation-id');

    const correlationId =
        incoming && /^[a-zA-Z0-9_-]{1,128}$/.test(incoming)
            ? incoming
            : randomUUID();

    res.setHeader('x-correlation-id', correlationId);

    requestContext.run({ correlationId }, next);
}