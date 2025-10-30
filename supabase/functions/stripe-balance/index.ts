import { handleCorsRequest, corsHeaders, createErrorResponse } from "cors";
import { getAuthContext, assertCanManageSales, getStripeAccountIdByLocation, getStripe, jsonResponse } from "../_shared/stripe-utils.ts";
import type Stripe from "stripe";

interface BalanceItem { amount: number; currency: string }
interface BalanceResponse { available: BalanceItem[]; pending: BalanceItem[]; updatedAt: string }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsRequest();
  if (req.method !== "GET") return createErrorResponse("Method not allowed", 405);

  try {
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

    const balance: Stripe.Balance = await stripe.balance.retrieve({}, { stripeAccount: acct });
    const available: BalanceItem[] = (balance.available ?? []).map((b) => ({ amount: b.amount, currency: b.currency }));
    const pending: BalanceItem[] = (balance.pending ?? []).map((b) => ({ amount: b.amount, currency: b.currency }));
    const updatedAt = new Date().toISOString();
    const response: BalanceResponse = { available, pending, updatedAt };
    return jsonResponse(response);
  } catch (err) {
    console.error("stripe-balance error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});


