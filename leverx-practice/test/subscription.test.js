import cds from '@sap/cds';

const { POST, expect, defaults } = cds.test();
const timestamp = new Date().toISOString();

defaults.path = '/odata/v4/subscription';
defaults.auth = { username: 'manager', password: 'manager123' };

describe('Subscription activation', () => {

    it('activates a pending subscription', async () => {

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'sub-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const activateResponse = await POST(`/Subscriptions(${ID})/SubscriptionService.activate`, {});
        expect(activateResponse.status).to.eql(200);
        expect(activateResponse.data.status).to.eql('provisioning');
    });

    it('rejects repeated activation of a subscription', async () => {

        let verifiedError = null;

        const createResponse = await POST(`/Subscriptions`, {
            subaccountId: 'sub-001',
            edition: 'standard',
            status: 'pending',
            createdAt: timestamp
        });

        expect(createResponse.status).to.eql(201);
        const ID = createResponse.data.ID;

        const activateResponse = await POST(`/Subscriptions(${ID})/SubscriptionService.activate`, {});
        expect(activateResponse.status).to.eql(200);
        expect(activateResponse.data.status).to.eql('provisioning');

        try {
            await POST(`/Subscriptions(${ID})/SubscriptionService.activate`, {});
        } catch (error) {
            verifiedError = error;
        }

        expect(verifiedError).to.not.eql(null);
        expect(verifiedError.status).to.eql(409);
    });

    it('rejects activation of nonexistent subscription', async () => {

        let verifiedError = null;
        const invalidId = '00000000-0000-0000-0000-000000000000';

        try {
            await POST(`/Subscriptions(${invalidId})/SubscriptionService.activate`, {});
        } catch (error) {
            verifiedError = error;
        }

        expect(verifiedError).to.not.eql(null);
        expect(verifiedError.status).to.eql(404);
    });
});