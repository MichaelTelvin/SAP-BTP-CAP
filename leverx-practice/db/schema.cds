namespace practice;

entity Subscription {
    key ID           : UUID;
        subaccountId : String(100) @mandatory;
        edition      : String(20)  @mandatory  @assert.range: true  enum {
            standard;
            advanced;
        };
        status       : String(20);
        createdAt    : Timestamp;
        events       : Association to many ActivationEvents
                           on events.subscription = $self;
}

entity ActivationEvents {
    key ID           : UUID;
        subscription : Association to Subscription;
        activatedAt  : Timestamp;
}
