import { handleCorsRequest, createErrorResponse } from "cors";
import { getAuthContext, assertCanManageSales, getStripeAccountIdByLocation, getStripe, jsonResponse } from "../_shared/stripe-utils.ts";
import type Stripe from "stripe";

interface DisputeItem {
  id: string;
  amount: number;
  currency: string;
  status: Stripe.Dispute.Status;
  evidenceDueBy: string | null;
  reason: Stripe.Dispute.Reason;
  paymentIntentId: string | null;
}
interface DisputesResponse { items: DisputeItem[] }

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

  const status = url.searchParams.get("status") ?? undefined;
  const list = await stripe.disputes.list({ status: status as any }, { stripeAccount: acct });
  const items: DisputeItem[] = list.data.map((d) => ({
    id: d.id,
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    evidenceDueBy: (d.evidence_details as any)?.due_by
      ? new Date(((d.evidence_details as any).due_by as number) * 1000).toISOString()
      : null,
    reason: d.reason,
    paymentIntentId: d.payment_intent as string | null,
  }));
  const response: DisputesResponse = { items };
  return jsonResponse(response);
});


