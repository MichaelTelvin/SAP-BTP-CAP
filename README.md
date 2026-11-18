# SAP BTP Subscription Provisioning

A practice project demonstrating subscription management and asynchronous provisioning using SAP CAP (Cloud Application Programming Model), Express.js, and SAP Business Technology Platform (BTP).

## Architecture

The project consists of two backend applications:

- **CAP (`leverx-practice`)** — Exposes an OData API for subscription management, handles activation requests, asynchronous processing, and reconciliation.
- **Express (`express-practice`)** — Provides a REST API for resource provisioning, including idempotent operations and simulated failure scenarios.

The applications communicate through the SAP BTP Destination service using OAuth2 client credentials.

## Technology Stack

- Node.js, SAP CAP, Express.js
- SAP HANA (separate HDI containers)
- SAP XSUAA for authentication and authorization
- SAP BTP Destination service
- SAP Cloud Foundry and Multi-Target Applications (MTA)
- SQLite for local development

## Key Features

- Subscription creation, activation, and status tracking
- Role-based access control
- Asynchronous provisioning with retries
- Idempotent REST provisioning operations
- Reconciliation of uncertain provisioning outcomes
- Correlation IDs and structured logging
- Cloud Foundry deployment with managed service bindings

## Project Structure

```text
sap-btp-practice/
├── leverx-practice/    # CAP subscription service
├── express-practice/   # Express provisioning API
├── mta.yaml            # BTP deployment configuration
└── xs-security.json    # XSUAA security configuration
```

## Local Development

Install dependencies in each application:

```bash
cd express-practice && npm ci
cd ../leverx-practice && npm ci
```

Start Express:

```bash
cd express-practice
npm run dev
```

Start CAP in a separate terminal:

```bash
cd leverx-practice
npx cds deploy --to sqlite
npx cds watch
```

By default, Express runs on port `3000` and CAP on port `4004`.

## Deployment to SAP BTP

The root `mta.yaml` defines both applications, their HANA HDI containers, XSUAA integration, and destination configuration.

Build and deploy from the repository root:

```bash
mbt build
cf deploy mta_archives/leverx-practice_1.0.0.mtar
```

## Tests

Both applications contain automated tests, executable with:

```bash
npm test
```

Run the command separately in each application directory.

**Prerequisite:**

 Node.js 24 (see `.nvmrc`). 
 Make sure Node.js 24 is active before installing dependencies or running the applications.
