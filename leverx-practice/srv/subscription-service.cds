using {practice as db} from '../db/schema';


service SubscriptionService {

    entity Subscriptions @(restrict: [
        {
            grant: 'READ',
            to   : [
                'SubscriptionViewer',
                'SubscriptionManager'
            ]
        },
        {
            grant: [
                'CREATE',
                'activate'
            ],
            to   : ['SubscriptionManager']
        }
    ])  as projection on db.Subscription

        actions {
            action activate() returns Subscriptions
        }

    entity ActivationEvents @(restrict: [{
        grant: 'READ',
        to   : [
            'SubscriptionViewer',
            'SubscriptionManager'
        ]
    }]) as projection on db.ActivationEvents
}
