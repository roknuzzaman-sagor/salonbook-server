# SalonBook Server

Express + MongoDB backend for SalonBook, a salon appointment booking platform.

## Features

- REST API for services, appointments, users, dashboard stats, and transactions
- JWT-protected routes with role-based access (`customer`, `admin`)
- Better Auth token bridge endpoint (`POST /auth/token`) secured by `INTERNAL_API_SECRET`
- Stripe Checkout session creation for confirmed, unpaid appointments
- Stripe webhook verification for authoritative payment confirmation
- Transaction storage in MongoDB after verified `checkout.session.completed`
- Admin setup endpoint for promoting a registered user to admin

## Tech Stack

- Node.js / Express
- MongoDB
- JWT (`jsonwebtoken`)
- Stripe
- CORS / dotenv

## Environment Variables

Create a `.env` file in the server root. Do not commit secrets.

```env
DB_URL=
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=
INTERNAL_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Run Locally

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000` by default.

## Seed Services (optional)

If the services collection is empty:

```bash
node seed.js
```

## Admin Setup

1. Register a normal user from the client.
2. Promote that user to admin:

```bash
POST /setup/admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "secret": "<INTERNAL_API_SECRET>"
}
```

## Stripe Webhook (Local)

Stripe payment status is updated only after verified webhook events.

```bash
stripe listen --forward-to localhost:5000/payments/webhook
```

Use the webhook signing secret printed by Stripe CLI as `STRIPE_WEBHOOK_SECRET`, then restart the server.

## Main Endpoints

- `GET /services` - list services (supports filters)
- `GET /services/:id` - service details
- `POST/PATCH/DELETE /services/:id` - admin service management
- `POST /appointments` - customer appointment request
- `GET /appointments/my` - customer appointments
- `GET /appointments` - admin all appointments
- `PATCH /appointments/:id/status` - update appointment status
- `POST /payments/create-checkout-session` - create Stripe Checkout session
- `POST /payments/webhook` - Stripe webhook (raw body)
- `GET /transactions` - admin transactions
- `GET /stats/admin` - admin dashboard stats
- `GET /stats/customer` - customer dashboard stats
- `GET/PATCH /users/me` - profile
- `GET /users` - admin users
- `PATCH /users/:id/block` - admin block/unblock user
