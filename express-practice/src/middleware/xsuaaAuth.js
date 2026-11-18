
const xsenv = require('@sap/xsenv');
const {
    XsuaaService,
    createSecurityContext,
    errors: { ValidationError }
} = require('@sap/xssec');

const { logger } = require('../logger');

const isCloudFoundry = Boolean(process.env.VCAP_APPLICATION);

const authService = isCloudFoundry
    ? new XsuaaService(
        xsenv.getServices({ uaa: { label: 'xsuaa' } }).uaa
    )
    : null;

async function xsuaaAuth(req, res, next) {
    // Keep existing local development and tests unchanged.
    if (!authService) return next();

    try {
        const context = await createSecurityContext(authService, { req });

        if (!context.checkLocalScope('ProvisioningExecute')) {
            logger.warn('Provisioning access denied');
            return res.status(403).json({ error: 'Forbidden' });
        }

        req.authInfo = context;
        next();
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn('Request authentication failed');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        logger.error({ err }, 'Authentication validation failed');
        return res.status(500).json({ error: 'Authentication error' });
    }
}

module.exports = xsuaaAuth;
