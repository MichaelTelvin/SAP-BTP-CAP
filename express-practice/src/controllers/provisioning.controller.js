const provisioningService = require('../services/provisioning.service');

const provisioningController = {

    provisionResource: async (req, res) => {

        const { subaccountId, subscriptionId } = req.body;

        if (typeof subaccountId !== 'string' || subaccountId.trim().length === 0) {
            return res.status(400).send({ 'message': 'Bad Request: subaccountId is required.' });
        }

        if (typeof subscriptionId !== 'string' || subscriptionId.trim().length === 0) {
            return res.status(400).send({ 'message': 'Bad Request: subscriptionId is required.' });
        }

        await provisioningService.provisionResource(subaccountId, subscriptionId);
        return res.status(200).json({ 'status': 'provisioned' });
    },

    getProvisionedResource: async (req, res) => {

        const { subscriptionId } = req.params;

        if (typeof subscriptionId !== 'string' || subscriptionId.trim().length === 0) {
            return res.status(400).send({ 'message': 'Bad Request: subscriptionId is required.' });
        }

        const provisionedResource = await provisioningService.getProvisionedResource(subscriptionId);
        if (!provisionedResource) {
            return res.status(404).send({ 'message': 'Resource not found.' });
        }

        return res.status(200).json(provisionedResource);
    }
};


module.exports = provisioningController;