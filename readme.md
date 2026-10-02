# MapleBudget — Canadian Budgeting PWA

## Overview

**MapleBudget** is a mobile-first personal budgeting application for Canadian users. It brings account balances, transactions, budgets, recurring income, savings goals, and notifications into one interface, with amounts and default preferences centered on CAD and Canadian banking.

The app is built as a Progressive Web App (PWA). It includes dashboard summaries, manual account and transaction workflows, demo bank-sync flows, and a PostgreSQL data layer that can be hosted on Neon.

> **Project status:** This repository is a prototype/demo. The Flinks connection flow currently creates simulated data rather than connecting to a live Flinks account. Authentication also contains demo behavior and is not production-ready; review the security section before exposing a deployment to real users.

## Target Users

- Individuals tracking Canadian income, spending, and account balances
- People planning category-based budgets and savings goals
- Developers evaluating a budgeting PWA with a PostgreSQL and Flinks-oriented data model

## Key User Stories

### Budgeting and account holders

- Review cash flow, net worth, accounts, recent transactions, and budget progress on a dashboard
- Add manually managed accounts and transactions
- Categorize spending and adjust transaction details
- Set category allocations for budgets
- Track recurring income patterns and expected dates
- Create savings goals and record contributions
- Review notifications and update personal budgeting preferences
- Install the PWA on supported devices

### Bank-sync demo users

- Browse a seeded list of Canadian financial institutions
- Start a simulated Flinks connection flow and populate sample accounts and transactions
- Review connection status and trigger a demo refresh

## Main Modules and Features

| Module | Current behavior |
| --- | --- |
| Dashboard | Summarizes assets, liabilities, net worth, available funds, monthly cash flow, budgets, goals, recent transactions, and unread notifications |
| Accounts | Lists connected and manual accounts; supports adding a manual account |
| Transactions | Lists and filters transactions, supports transaction creation and updates, and uses Canadian merchant/category rules in the demo sync flow |
| Budgets | Creates and updates budgets with category allocations and spending progress |
| Recurring income | Lists and manages recurring patterns and income sources |
| Goals | Tracks financial goals and records contributions |
| Notifications | Lists notifications and marks them as read |
| Settings | Updates budget and pay-cycle preferences; provides demo-data seeding and data export actions |
| Bank connections | Stores connection records and sync state; the current UI/API flow simulates sync data |
| PWA | Provides an install prompt, service-worker registration in production, and an offline status notice |

## Technical Architecture

### Frontend

- **Framework:** Next.js 16 App Router, React 19, and TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **PWA:** Web app manifest, service worker, install prompt, and responsive navigation
- **Main interface:** A client-rendered dashboard with tab-based screens under `src/components/screens`

### Backend

- **Runtime:** Next.js Route Handlers on Node.js
- **Database:** PostgreSQL through `pg` and Drizzle ORM; Neon is supported through its PostgreSQL connection URL
- **Schema:** Defined in `src/db/schema.ts`
- **Database tooling:** Drizzle Kit reads `DATABASE_URL` from the environment via `drizzle.config.ts`
- **Banking integration:** Flinks-shaped models, webhook handler, and demo/mock sync logic; live Flinks credentials and production connectivity are not currently configured

### Authentication

The API includes register, login, logout, and current-user actions. Passwords are hashed with `bcryptjs`, and the session identifier is stored in an HTTP-only cookie. However, the current implementation also has a hard-coded demo password fallback and automatically seeds/uses a default demo user when no session is present. **Do not use this authentication flow for real financial data or production users without replacing and reviewing it.**

## Data Models

The Drizzle schema currently includes:

- **Users and settings:** email, password hash, locale preferences, budget period, pay cycle, alert thresholds, and privacy preferences
- **Institutions and provider connections:** institution metadata, Flinks identifiers, connection state, and sync health
- **Financial accounts and balance snapshots:** account type, masked number, balances, currency, and sync timestamps
- **Transactions and categories:** signed amounts, merchant, category, pending/transfer/refund flags, notes, and duplicate-detection fingerprint
- **Merchant rules:** user-defined merchant matching and categorization targets
- **Budgets and budget items:** period dates, income/expense targets, category allocations, and carry-over amounts
- **Recurring patterns and income sources:** frequency, expected amount, confidence, status, and next expected date
- **Financial goals and contributions:** target/current amount, dates, linked account, and contribution history
- **Notifications, sync runs, webhook events, and audit logs:** operational history and user alerts

**Transaction convention:** negative amounts represent money leaving an account; positive amounts represent money entering an account. Credit-card balances are treated as liabilities in dashboard totals.

## API Overview

All endpoints are implemented as Next.js Route Handlers under `src/app/api`.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/auth` | `GET`, `POST` | Read current user; register, log in, or log out |
| `/api/dashboard` | `GET` | Return dashboard summaries and related account data |
| `/api/accounts` | `GET`, `POST` | List accounts and create a manual account |
| `/api/transactions` | `GET`, `POST` | List and create transactions |
| `/api/transactions/[id]` | `PATCH` | Update a transaction |
| `/api/budgets` | `GET`, `POST` | List and create budgets |
| `/api/budgets/[id]` | `PATCH` | Update a budget |
| `/api/recurring-income` | `GET`, `POST` | List and create recurring income patterns |
| `/api/recurring-income/[id]` | `PATCH` | Update a recurring pattern |
| `/api/goals` | `GET`, `POST` | List and create financial goals |
| `/api/goals/[id]/contributions` | `POST` | Add a contribution to a goal |
| `/api/connections` | `GET` | List provider connections |
| `/api/connections/[id]` | `DELETE` | Remove a provider connection |
| `/api/connections/[id]/refresh` | `POST` | Request a connection refresh |
| `/api/flinks/session` | `GET`, `POST` | List demo institutions and start a simulated connection |
| `/api/flinks/webhook` | `POST` | Receive Flinks-shaped webhook events |
| `/api/settings` | `GET`, `PATCH`, `POST` | Read/update settings, seed demo data, or export user data |
| `/api/notifications` | `GET` | List notifications |
| `/api/notifications/[id]/read` | `PATCH` | Mark a notification as read |
| `/api/health` | `GET` | Check database connectivity |

## External Services and Integrations

| Service | Use in this repository |
| --- | --- |
| Neon | PostgreSQL hosting via `DATABASE_URL`; no Neon account or credentials are included in the repository |
| Flinks | Demo-oriented connection model, mock sync, and webhook route; a live provider integration is not configured |
| Canadian financial institutions | Seeded institution metadata and sample data only |

No Google Maps, AI, pharmaceutical, or medical services are part of this project.

## Security and Privacy Notes

This prototype handles financial-shaped data, but it should not be considered secure or compliant for production use. Before using real users or account data:

- Replace the demo authentication behavior, remove the hard-coded credential fallback, and stop automatically assigning unauthenticated requests to a seeded user
- Review session-cookie settings, CSRF protections, authorization on every route, and webhook signature verification
- Configure secrets through the deployment platform; never commit credentials or real financial data
- Review logging, data retention, encryption, backups, and applicable privacy obligations
- Connect only to a properly configured live banking provider after reviewing its security requirements

## Environment Variables

Create `.env.local` in the project root for local development:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

Use the PostgreSQL connection string from your Neon project. In Vercel, set `DATABASE_URL` in the project’s Environment Variables for each environment that needs database access. The application initializes the database lazily, so this variable is not required just to build; it is required when a request accesses the database and when running Drizzle Kit commands.

## Getting Started

### Requirements

- Node.js 20.9 or later
- npm
- A PostgreSQL database; Neon is supported

### Install and run

```bash
npm install
```

Add `DATABASE_URL` to `.env.local`, then apply the Drizzle schema to the configured database:

```bash
npx drizzle-kit push
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app can seed a demo user and sample Canadian financial data when its demo user is first requested. Do not use the demo data or authentication behavior for production.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

## Deployment

Deploy the Next.js application to a Node.js-compatible host such as Vercel. Configure `DATABASE_URL` with the Neon connection string in the host’s environment settings, and ensure the Neon database has the schema applied before the application handles database-backed requests. No Flinks secrets are used by the current simulated flow.

## License

No license file or license terms are currently specified in this repository. Add a license before redistributing the project.
