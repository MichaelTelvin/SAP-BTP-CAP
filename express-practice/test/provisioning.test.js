const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

describe('Provisioning subscription', () => {

    let server, provisionApi, tempDir, subscriptionId;

    beforeEach((_, done) => {
        subscriptionId = crypto.randomUUID();
        done();
    });

    before((_, done) => {
        tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'provisioning-test-')
        );

        process.env.DB_PATH = path.join(tempDir, 'test.db');

        // Import only after DB_PATH is configured
        app = require('../src/app');
        db = require('../src/db/connection');

        server = app.listen(0, () => {
            const { port } = server.address();
            provisionApi = `http://localhost:${port}/api/provision`;
            done();
        });
    });

    after((_, done) => {
        server.close(() => {
            db.close();
            fs.rmSync(tempDir, { recursive: true, force: true });
            delete process.env.DB_PATH;
            done();
        });
    });

    it('provisions subscription successfully', async () => {

        const payload = {
            subscriptionId,
            subaccountId: 'sub-001'
        };

        const response = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        assert.equal(response.status, 200);

        const res = await fetch(`${provisionApi}/${subscriptionId}`);
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.equal(data.subaccountId, payload.subaccountId);
    });

    it('handles duplicate request idempotently', async () => {

        const payload = {
            subscriptionId,
            subaccountId: 'sub-001'
        };

        const response = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        assert.equal(response.status, 200);

        const res = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 200);

        const row = db.prepare(
            `SELECT COUNT(*) AS count, subaccountId
            FROM ProvisionedResources
            WHERE subscriptionId = ?`
        ).get(subscriptionId);

        assert.equal(row.count, 1);
        assert.equal(row.subaccountId, payload.subaccountId);
    });

    it('rejects conflicting requests correctly', async () => {

        const initialPayload = {
            subscriptionId,
            subaccountId: 'sub-001'
        };
        const testPayload = {
            subscriptionId,
            subaccountId: 'sub-002'
        };

        const response = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(initialPayload),
        });

        assert.equal(response.status, 200);

        const res = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
        });

        assert.equal(res.status, 409);

        const row = db.prepare(
            `SELECT COUNT(*) AS count, subaccountId
            FROM ProvisionedResources
            WHERE subscriptionId = ?`
        ).get(subscriptionId);

        assert.equal(row.count, 1);
        assert.equal(row.subaccountId, initialPayload.subaccountId);
    });

    it('verifies that no resource is created on service failure', async () => {

        const payload = {
            subscriptionId,
            subaccountId: 'fail-001'
        };

        const response = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        assert.equal(response.status, 503);

        const row = db.prepare(
            `SELECT COUNT(*) AS count
            FROM ProvisionedResources
            WHERE subscriptionId = ?`
        ).get(subscriptionId);

        assert.equal(row.count, 0);
    });

    it('verifies that resource is created before service failure', async () => {

        const payload = {
            subscriptionId,
            subaccountId: 'uncertain-001'
        };

        const response = await fetch(provisionApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        assert.equal(response.status, 503);

        const row = db.prepare(
            `SELECT COUNT(*) AS count
            FROM ProvisionedResources
            WHERE subscriptionId = ?`
        ).get(subscriptionId);

        assert.equal(row.count, 1);

        const res = await fetch(`${provisionApi}/${subscriptionId}`);
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.equal(data.subaccountId, payload.subaccountId);
    });
});