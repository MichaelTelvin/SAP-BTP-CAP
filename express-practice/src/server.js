const app = require('./app');
const { logger } = require('./logger');
const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Provisioning service listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down provisioning service');

    server.close((err) => {
        if (err) {
            logger.error(err, 'Shutdown failed');
            process.exitCode = 1;
        }
    });
});