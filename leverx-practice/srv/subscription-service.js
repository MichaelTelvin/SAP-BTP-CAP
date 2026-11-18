import cds from '@sap/cds';
const logger = cds.log('subscription');

const subscriptionService = cds.service.impl(
    async function () {

        const provisioning = await cds.connect.to('ProvisioningService');
        const queuedProvisioning = cds.queued(provisioning);

        provisioning.after('CREATE/#succeeded', async (_result, req) => {
            logger.info('Provisioning completed');

            await completeActivation(req.data.subscriptionId, 'provisioning');
        });


        provisioning.after('CREATE/#failed', async (error, req) => {
            const ID = req.data.subscriptionId;
            const { Subscriptions } = this.entities;

            await cds.tx(async (tx) => {
                await tx.run(
                    UPDATE(Subscriptions)
                        .set({ status: 'reconciling' })
                        .where({ ID, status: 'provisioning' })
                );
            });

            logger.info('Scheduling reconciliation...');

            // reconciliation
            await this.schedule('reconcileActivation', req.data)
                .after(process.env.RCLN_TIMEOUT || '5m')
                .as(`reconcile-${ID}`);
        });


        const completeActivation = async (subscriptionId, prevStatus) => {

            logger.info('Completing activation...');

            const { Subscriptions, ActivationEvents } = this.entities;

            await cds.tx(async (tx) => {
                const affectedRows = await tx.run(
                    UPDATE(Subscriptions)
                        .set({ status: 'active' })
                        .where({ ID: subscriptionId, status: prevStatus })
                );

                if (affectedRows === 1) {
                    await tx.run(
                        INSERT.into(ActivationEvents).entries({
                            subscription_ID: subscriptionId,
                            activatedAt: new Date().toISOString()
                        })
                    );
                }
            });
        };

        this.on('reconcileActivation', async (event) => {

            let resource = null;
            const { Subscriptions } = this.entities;
            const { subscriptionId, subaccountId } = event.data;

            try {
                resource = await provisioning.send({
                    method: 'GET',
                    path: `/api/provision/${encodeURIComponent(subscriptionId)}`
                });
            } catch (error) {
                const status = error?.reason?.response?.status;
                const nextStatus = status === 404 ? 'failed' : 'needs_attention';

                logger.error('Reconciliation failed:', subscriptionId, error);

                await cds.tx(tx =>
                    tx.run(
                        UPDATE(Subscriptions)
                            .set({ status: nextStatus })
                            .where({ ID: subscriptionId, status: 'reconciling' })
                    )
                );

                return;
            }

            if (resource?.subaccountId === subaccountId) {
                await completeActivation(subscriptionId, 'reconciling');
            } else {
                await cds.tx(tx =>
                    tx.run(
                        UPDATE(Subscriptions)
                            .set({ status: 'needs_attention' })
                            .where({ ID: subscriptionId, status: 'reconciling' })
                    )
                );
            }
        });

        this.on('activate', 'Subscriptions', async (req) => {

            const { ID } = req.params[0];
            const { Subscriptions } = this.entities;

            const affectedRows = await UPDATE(Subscriptions)
                .set({ status: 'provisioning' })
                .where({ ID, status: 'pending' });

            const subscription = await SELECT.one.from(Subscriptions).where({ ID });

            if (affectedRows === 0) {
                req.reject(
                    subscription ? 409 : 404,
                    subscription ? 'Subscription status conflict' : 'Subscription not found'
                );
            }

            await queuedProvisioning.send({
                method: 'POST',
                path: '/api/provision',
                data: { subscriptionId: ID, subaccountId: subscription.subaccountId }
            });

            return subscription;
        });
    }
);

export default subscriptionService;
