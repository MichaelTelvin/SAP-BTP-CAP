import cds from '@sap/cds';
import assert from 'node:assert/strict';

const { GET, POST, expect, defaults } = cds.test();
const timestamp = new Date().toISOString();

defaults.path = '/odata/v4/subscription';



describe('Subscription creation: authorization testing', () => {

    it('manager creates subscription successfully', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'sub-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        }, {
            auth: { username: 'manager', password: 'manager123' }
        });

        expect(createResponse.status).to.eql(201);
    });

    it('manager reads subscription successfully', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'sub-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        }, {
            auth: { username: 'manager', password: 'manager123' }
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const getResponse = await GET(`/Subscriptions/${ID}`, {
            auth: { username: 'manager', password: 'manager123' }
        });
        expect(getResponse.status).to.eql(200);
    });

    it('viewer not permitted to create subscription', async () => {
        await assert.rejects(
            POST('/Subscriptions', {
                subaccountId: 'sub-001',
                edition: 'standard',
                status: 'pending',
                createdAt: timestamp
            }, {
                auth: { username: 'viewer', password: 'viewer123' }
            }),
            { status: 403 }
        );
    });

    it('viewer reads subscription successfully', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'sub-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        }, {
            auth: { username: 'manager', password: 'manager123' }
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const getResponse = await GET(`/Subscriptions/${ID}`, {
            auth: { username: 'viewer', password: 'viewer123' }
        });
        expect(getResponse.status).to.eql(200);
    });
});