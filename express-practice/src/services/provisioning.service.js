const HttpError = require('../errors/HttpError');
const repository = require('../db/repository');
const { logger } = require('../logger');

const provisioningService = {

    provisionResource: async (subaccountId, subscriptionId) => {

        // simulate failing connection
        if (subaccountId === 'fail-001') {
            logger.info('Simulating unavailable service');
            throw new HttpError(503, 'Provisioning service unavailable');
        }

        logger.info({ subscriptionId, subaccountId }, 'Provisioning resource...');

        await repository.insertIfAbsent(
            subscriptionId,
            subaccountId,
            new Date().toISOString()
        );

        const row = await repository.findBySubscriptionId(subscriptionId);

        if (row.subaccountId !== subaccountId) {
            logger.error({ dbSubaccountId: row.subaccountId, reqSubaccountId: subaccountId }, 'Provisioning resource conflict');
            throw new HttpError(409, 'Provisioning resource conflict');
        }

        // simulate failed response after resource has been created
        if (subaccountId === 'uncertain-001') {
            logger.info('Simulating lost response');
            throw new HttpError(503, 'Simulated lost response');
        }

        return;
    },

    getProvisionedResource: async (subscriptionId) => {

        const resource = await repository.findBySubscriptionId(subscriptionId);
        return resource;
    }
};

module.exports = provisioningService;
