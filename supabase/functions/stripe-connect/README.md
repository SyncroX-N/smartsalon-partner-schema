Stripe Connect Webhook (Company flags)

This webhook keeps `Company.payoutsEnabled` and `Company.chargesEnabled` in sync with Stripe Connect account state.

Events handled
- account.updated: reads `charges_enabled`, `payouts_enabled`, `details_submitted`, `capabilities`, `requirements`
- capability.updated: fetches the account and recomputes flags (covers capability state changes)

Environment variables
- STRIPE_SECRET_KEY: Stripe secret key
- STRIPE_WEBHOOK_SECRET: webhook signing secret for this endpoint
- SUPABASE_URL: Supabase project URL
- SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-only)

Deployment
1) Deploy the webhook as a Supabase Edge Function route under `supabase/functions` or host as HTTP endpoint (current path: `supabase/webhooks/stripe-connect/index.ts`). If using Supabase functions, mirror structure accordingly.
2) In Stripe Dashboard, add an endpoint with events: `account.updated`, `capability.updated` and paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
3) Confirm that `Company.stripeAccountId` is set when creating the account (done in `create-stripe-account-link`).

Notes
- Updates the `Company` row by matching `stripeAccountId`.
- Ignores unrelated event types.
- Also persists onboarding metadata:
  - `stripeDetailsSubmitted: boolean`
  - `stripeOnboardingStatus: StripeOnboardingStatus`
  - `stripeRequirementsDue: { currentlyDue, eventuallyDue, pastDue, pendingVerification, disabledReason }`
  - `stripeCardPaymentsCapability: 'active' | 'inactive' | 'pending'`
  - `stripeTransfersCapability: 'active' | 'inactive' | 'pending'`

