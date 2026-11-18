
const provisioningController = require('../controllers/provisioning.controller');
const express = require('express');
const router = express.Router();

router.post('/', provisioningController.provisionResource);
router.get('/:subscriptionId', provisioningController.getProvisionedResource);

module.exports = router;