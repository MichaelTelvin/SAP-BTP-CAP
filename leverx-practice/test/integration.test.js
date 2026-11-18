import cds from '@sap/cds';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { GET, POST, expect, defaults } = cds.test();
const timestamp = new Date().toISOString();

defaults.path = '/odata/v4/subscription';
defaults.auth = { username: 'manager', password: 'manager123' };

let server, provisionApi, tempDir, app, db, subscriptionId;

describe('Subscription activation integration test', () => {

    before((_, done) => {
        tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'integration-test-')
        );

        process.env.DB_PATH = path.join(tempDir, 'test.db');
        process.env.RCLN_TIMEOUT = '1s';

        // Import only after DB_PATH is configured
        app = require('../../express-practice/src/app');
        db = require('../../express-practice/src/db/connection');

        server = app.listen(3000, () => {
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

    it('creates and activates a subscription', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'sub-003',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const activateResponse = await POST(`/Subscriptions(${ID})/SubscriptionService.activate`, {});
        expect(activateResponse.status).to.eql(200);
        expect(activateResponse.data.status).to.eql('provisioning');

        const subscription = await waitForStatus(ID, 'active');
        expect(subscription.status).to.eql('active');
        expect(subscription.events.length).to.eql(1);

        const getResponse = await GET(`${provisionApi}/${ID}`);
        expect(getResponse.status).to.eql(200);
        expect(getResponse.data.subaccountId).to.eql('sub-003');
    });

    it('tries to reconcile and fails resource', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'fail-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const activateResponse = await POST(`/Subscriptions(${ID})/SubscriptionService.activate`, {});
        expect(activateResponse.status).to.eql(200);
        expect(activateResponse.data.status).to.eql('provisioning');

        const subscription = await waitForStatus(ID, 'failed', 10000);
        expect(subscription.status).to.eql('failed');
        expect(subscription.events.length).to.eql(0);

        await assert.rejects(GET(`${provisionApi}/${ID}`), { status: 404 });
    });

    it('tries to reconcile and activates resource', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'uncertain-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const activateResponse = await POST(`/Subscriptions(${ID})/SubscriptionService.activate`, {});
        expect(activateResponse.status).to.eql(200);
        expect(activateResponse.data.status).to.eql('provisioning');

        const subscription = await waitForStatus(ID, 'active', 10000);
        expect(subscription.status).to.eql('active');
        expect(subscription.events.length).to.eql(1);

        const getResponse = await GET(`${provisionApi}/${ID}`);
        expect(getResponse.status).to.eql(200);
        expect(getResponse.data.subaccountId).to.eql('uncertain-001');
    });
});

const waitForStatus = async (ID, expected, timeoutMs = 5000) => {
    const deadline = Date.now() + timeoutMs;
    let lastStatus = 'unknown';

    while (Date.now() < deadline) {
        const response = await GET(`/Subscriptions(${ID})?$expand=events`);

        lastStatus = response.data.status;

        if (lastStatus === expected) {
            return response.data;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Subscription ${ID}: expected ${expected}, last status ${lastStatus}`);
};