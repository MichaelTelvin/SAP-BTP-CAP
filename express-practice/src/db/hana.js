const hana = require('@sap/hana-client');
const xsenv = require('@sap/xsenv');

async function openHanaConnection() {
    const { db } = xsenv.getServices({
        db: { label: 'hana', plan: 'hdi-shared' }
    });

    const connection = hana.createConnection();

    await new Promise((resolve, reject) => {
        connection.connect({
            serverNode: `${db.host}:${db.port}`,
            uid: db.user,
            pwd: db.password,
            currentSchema: db.schema,
            encrypt: 'true',
            sslValidateCertificate: 'true'
        }, err => err ? reject(err) : resolve());
    });

    return connection;
}

module.exports = { openHanaConnection };