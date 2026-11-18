
const { openHanaConnection } = require('./hana');

async function execute(sql, params) {
    const connection = await openHanaConnection();

    try {
        return await new Promise((resolve, reject) => {
            connection.exec(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    } finally {
        await new Promise((resolve, reject) => {
            connection.disconnect(err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = {
    async insertIfAbsent(subscriptionId, subaccountId, createdAt) {
        try {
            await execute(
                `INSERT INTO "ProvisionedResources"
                ("subscriptionId", "subaccountId", "created_at")
                VALUES (?, ?, ?)`,
                [subscriptionId, subaccountId, createdAt]
            );
        } catch (err) {
            // HANA error 301: unique constraint violated.
            // An existing subscription is handled by the service's conflict check.
            if (Number(err.code) !== 301) throw err;
        }
    },

    async findBySubscriptionId(subscriptionId) {
        const rows = await execute(
            `SELECT "subaccountId"
            FROM "ProvisionedResources"
            WHERE "subscriptionId" = ?`,
            [subscriptionId]
        );

        return rows[0] ?? null;
    }
};
