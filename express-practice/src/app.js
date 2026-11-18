const express = require('express');
const correlationMiddleware = require('./middleware/logHandler.js');
const errorHandler = require('./middleware/errorHandler');
const provisioningRoutes = require('./routes/provisioning.route');
const xsuaaAuth = require('./middleware/xsuaaAuth');

const app = express();

app.use(express.json());
app.use(correlationMiddleware);
app.use(xsuaaAuth);

app.use('/api/provision', provisioningRoutes);
app.use(errorHandler);

module.exports = app;

