# SalonBook - Salon Appointment Booking Platform (Server)

Express.js + MongoDB backend for SalonBook. This API handles authentication token bridging, service management, appointment requests, role-based dashboard data, Stripe Checkout session creation, and verified Stripe webhook payment confirmation.

## Live Links

- Live Website: `add-your-live-client-url`
- Client Repository: `add-your-client-repo-url`
- Server Repository: `add-your-server-repo-url`

## Admin Evaluation Credentials

- Admin Email: `add-admin-email`
- Admin Password: `add-admin-password`

> Replace placeholders before submission. Do not commit real secrets.

## Important Features

- REST API for services, appointments, users, stats, and transactions
- JWT-protected routes with server-side role verification (`customer`, `admin`)
- Better Auth token bridge endpoint (`POST /auth/token`) secured by `INTERNAL_API_SECRET`
- Service CRUD and active/inactive visibility control for admins
- Appointment request flow with status rules and duplicate active slot prevention
- Stripe Checkout session creation for confirmed, unpaid, customer-owned appointments
- Stripe webhook verification using raw request body and `STRIPE_WEBHOOK_SECRET`
- Payment status updated to paid only after verified `checkout.session.completed`
- Transaction upsert by `stripeSessionId` to avoid duplicate webhook processing
- Admin user management including block/unblock

## Technology Stack

- Node.js
- Express.js
- MongoDB
- JWT (`jsonwebtoken`)
- Stripe
- CORS / dotenv

## Installation Instructions

1. Clone the server repository.
2. Open the project folder.
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the server root and add required environment variables.
5. Start the development server.

## How to Run the Project Locally

```bash
npm install
npm run dev
```

The server runs on `http://localhost:5000` by default.

## Required Environment Variables

Create a `.env` file in the server root. Use variable names only in documentation and never commit actual secret values.


## Stripe Webhook Setup

The actual Stripe webhook route in this project is:

```text
POST /payments/webhook
```

Stripe payment status is updated only after verified webhook events.

### Local testing with Stripe CLI

```bash
stripe listen --forward-to localhost:5000/payments/webhook
```

Copy the CLI webhook signing secret into `STRIPE_WEBHOOK_SECRET`, then restart the server.

### Local testing with ngrok + Stripe Dashboard

If Stripe CLI is unavailable, expose the local server with ngrok and create a Stripe Dashboard webhook endpoint:

```text
https://<your-ngrok-domain>/payments/webhook
```

- Select event: `checkout.session.completed`
- Copy the Dashboard endpoint signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`
- Restart the server after changing `.env`
- Confirm Stripe Dashboard webhook deliveries return `200`

## Main API Endpoints

- `POST /auth/token` - issue JWT for authenticated Better Auth user (internal bridge)
- `GET /services` - list services (supports search/filter/sort)
- `GET /services/:id` - service details
- `POST /services` - create service (admin)
- `PATCH /services/:id` - update service (admin)
- `DELETE /services/:id` - delete service (admin)
- `POST /appointments` - create appointment request (customer)
- `GET /appointments/my` - customer appointments
- `GET /appointments` - all appointments (admin)
- `PATCH /appointments/:id/status` - update appointment status
- `POST /payments/create-checkout-session` - create Stripe Checkout session (customer)
- `POST /payments/webhook` - Stripe webhook (raw body, verified signature)
- `GET /transactions` - transactions (admin)
- `GET /stats/admin` - admin dashboard stats
- `GET /stats/customer` - customer dashboard stats
- `GET /users/me` - current user profile
- `PATCH /users/me` - update current user profile
- `GET /users` - list users (admin)
- `PATCH /users/:id/block` - block/unblock user (admin)

## Admin Setup

1. Register a normal user from the client app.
2. Promote the user to admin:

```bash
POST /setup/admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "secret": "<INTERNAL_API_SECRET>"
}
```

## Deployment Notes

- Deploy the server before testing live Stripe webhooks.
- Set all environment variables in the deployment platform.
- Configure Stripe Dashboard webhook to `https://<your-server-domain>/payments/webhook`.
- Ensure `CLIENT_URL` matches the deployed client URL for CORS.
- Do not expose `.env` or secret values.