const pino = require('pino');
const { AsyncLocalStorage } = require('node:async_hooks');

const requestContext = new AsyncLocalStorage();

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',

    mixin() {
        const correlationId =
            requestContext.getStore()?.correlationId;

        return correlationId
            ? { correlation_id: correlationId }
            : {};
    }
});

module.exports = { logger, requestContext };