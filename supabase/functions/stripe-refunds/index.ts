import { handleCorsRequest, createErrorResponse } from "cors";
import { getAuthContext, assertCanManageSales, getStripeAccountIdByLocation, getStripe, jsonResponse } from "../_shared/stripe-utils.ts";
import type Stripe from "stripe";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsRequest();

  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");
  if (!locationId) return jsonResponse({ error: "locationId is required" }, 400);

  const auth = await getAuthContext(req);
  if (auth instanceof Response) return auth;
  const { supabaseAdmin, userId } = auth;

  const perm = await assertCanManageSales(supabaseAdmin, userId, locationId);
  if (perm instanceof Response) return perm;

  const stripe = getStripe();
  if (stripe instanceof Response) return stripe;

  const acct = await getStripeAccountIdByLocation(supabaseAdmin, locationId);
  if (acct instanceof Response) return acct;

  if (req.method === "POST") {
    const body = (await req.json().catch(() => null)) || {};
    const paymentIntentId = body.paymentIntentId as string | undefined;
    const amount = body.amount as number | undefined;
    if (!paymentIntentId) return jsonResponse({ error: "paymentIntentId is required" }, 400);
    const refund: Stripe.Refund = await stripe.refunds.create({ payment_intent: paymentIntentId, amount }, { stripeAccount: acct });
    return jsonResponse(refund);
  }

  if (req.method === "GET") {
    const paymentIntentId = url.searchParams.get("paymentIntentId") ?? undefined;
    const list = await stripe.refunds.list({ payment_intent: paymentIntentId as any }, { stripeAccount: acct });
    const items: Stripe.Refund[] = list.data;
    return jsonResponse({ items });
  }

  return createErrorResponse("Method not allowed", 405);
});


