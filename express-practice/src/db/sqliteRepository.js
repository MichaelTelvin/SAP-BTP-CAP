
const db = require('./connection');

const insert = db.prepare(`
  INSERT INTO ProvisionedResources
    (subscriptionId, subaccountId, created_at)
  VALUES (?, ?, ?)
  ON CONFLICT(subscriptionId) DO NOTHING
`);

const select = db.prepare(`
  SELECT subaccountId
  FROM ProvisionedResources
  WHERE subscriptionId = ?
`);

module.exports = {
    async insertIfAbsent(subscriptionId, subaccountId, createdAt) {
        insert.run(subscriptionId, subaccountId, createdAt);
    },

    async findBySubscriptionId(subscriptionId) {
        return select.get(subscriptionId) ?? null;
    }
};
