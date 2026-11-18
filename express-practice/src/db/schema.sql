CREATE TABLE IF NOT EXISTS ProvisionedResources (
    subscriptionId TEXT PRIMARY KEY,
    subaccountId TEXT NOT NULL,
    created_at TEXT NOT NULL
);