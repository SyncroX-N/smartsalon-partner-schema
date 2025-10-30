import { handleCorsRequest, createErrorResponse } from "cors";
import { getAuthContext, assertCanManageSales, getStripeAccountIdByLocation, getStripe, jsonResponse } from "../_shared/stripe-utils.ts";
import type Stripe from "stripe";

interface PayoutItem {
  id: string;
  amount: number;
  currency: string;
  status: Stripe.Payout.Status;
  arrivalDate: string | null;
  failure_code: string | null;
}
interface PayoutsResponse { items: PayoutItem[] }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsRequest();
  if (req.method !== "GET") return createErrorResponse("Method not allowed", 405);

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

  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const created: Stripe.RangeQueryParam | undefined = from || to ? {
    gte: from ? Number(from) : undefined,
    lte: to ? Number(to) : undefined,
  } : undefined;

  const list = await stripe.payouts.list({ limit, created }, { stripeAccount: acct });
  const items: PayoutItem[] = list.data.map((p) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    arrivalDate: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString().slice(0, 10) : null,
    failure_code: (p as any).failure_code ?? null,
  }));
  const response: PayoutsResponse = { items };
  return jsonResponse(response);
});


