# Tenant Portal

A standalone web app where tenants sign in and pay rent online. Lives in this
repo for convenience but is **fully independent of Peptide Cortex** — its own
Next.js app, its own Supabase project, its own Stripe account. Nothing in
`src/` (the peptide app) imports from here or vice versa.

## How it works

- **Landlord** signs in with an email listed in `ADMIN_EMAILS` and manages
  tenants at `/admin`: add a tenant (email, name, unit, monthly rent, due day),
  see who has paid this month, and browse the payment ledger.
- **Tenant** creates an account at `/signup` using the email the landlord has
  on file. A database trigger links their auth user to their tenant record
  (in either order — signup-then-added or added-then-signup both work).
- **Dashboard** has stat tiles (rent status, open service requests, unit),
  quick actions (**Pay rent**, **Request service**), payment history, and
  recent service requests.
- **Service requests**: tenants file maintenance requests at `/requests`
  (category, summary, details), track their status, and can cancel open ones.
  The landlord updates statuses (open → in progress → resolved) from `/admin`.
  Tenants write these rows directly under RLS scoped to their own tenant
  record; status management goes through the service role.
- **Payment** goes through Stripe Checkout (mode: one-time payment). The
  webhook records the payment. ACH/bank payments are supported: they show as
  "processing" until Stripe's `async_payment_succeeded` event settles them.
- Double payment for the same month is blocked in the checkout route and by a
  partial unique index on `payments (tenant_id, period) where status='succeeded'`.

## Setup

1. **Supabase**: create a *new* Supabase project (do not reuse the Peptide
   Cortex one). Run `supabase/schema.sql` in the SQL editor. Copy the URL,
   anon key, and service-role key into `.env.local`.
2. **Stripe**: create (or use a dedicated) Stripe account. Copy the secret key.
   Add a webhook endpoint pointing at `https://<your-domain>/api/stripe/webhook`
   subscribed to `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`; copy its signing secret.
   Optionally enable **US bank account (ACH)** in Dashboard → Settings →
   Payment methods — strongly recommended for rent (0.8% capped at $5 vs
   ~2.9% + 30¢ for cards).
3. **Env**: `cp .env.example .env.local` and fill everything in.
4. **Run**: `npm install && npm run dev` → http://localhost:3100
5. **Deploy**: new Vercel project with *Root Directory* set to `tenant-portal`.
   Set the same env vars, plus `NEXT_PUBLIC_APP_URL` to the production URL.

## Security model

- All tables have RLS. Tenants can **read** only their own tenant record and
  payments. There are **no write policies** — every write goes through the
  service role in server-only code paths:
  - `/api/stripe/webhook` (verified by Stripe signature)
  - `/api/admin/*` (verified against `ADMIN_EMAILS` on the server)
- The amount charged always comes from `tenants.monthly_rent_cents` on the
  server — the client never sends an amount.
- Webhook DB failures return 500 so Stripe retries delivery.

## Not built yet (deliberate v1 cuts)

- Autopay (Stripe subscription per tenant) — natural v2.
- Partial payments / late fees / proration.
- Email receipts beyond Stripe's own receipt emails (enable those in the
  Stripe dashboard).
- Multi-property support (add a `properties` table when needed).
