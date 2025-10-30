import { handleCorsRequest, createErrorResponse } from "cors";
import { getAuthContext, assertCanManageSales, getStripeAccountIdByLocation, getStripe, jsonResponse } from "../_shared/stripe-utils.ts";
import type Stripe from "stripe";

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: Stripe.PaymentIntent.Status;
  created: number;
  cardLast4: string | null;
  receiptUrl: string | null;
  metadata: Record<string, string>;
}
interface PaymentsResponse { items: PaymentItem[] }

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
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const created: Stripe.RangeQueryParam | undefined = from || to ? {
    gte: from ? Number(from) : undefined,
    lte: to ? Number(to) : undefined,
  } : undefined;

  const list = await stripe.paymentIntents.list(
    { limit, created, status: status as any, expand: ["data.latest_charge"] },
    { stripeAccount: acct }
  );

  const items: PaymentItem[] = list.data
    .filter((pi) => {
      const locMeta = (pi.metadata?.locationId ?? (pi as any).charges?.data?.[0]?.metadata?.locationId) as string | undefined;
      if (!locMeta) return false;
      return locMeta === locationId;
    })
    .map((pi) => {
      const charge = (pi.latest_charge as Stripe.Charge) || undefined;
      const card = charge?.payment_method_details?.card;
      return {
        id: pi.id,
        amount: pi.amount ?? charge?.amount ?? 0,
        currency: pi.currency ?? charge?.currency ?? "gbp",
        status: pi.status,
        created: pi.created,
        cardLast4: card?.last4 ?? null,
        receiptUrl: charge?.receipt_url ?? null,
        metadata: pi.metadata ?? {},
      };
    });
  const response: PaymentsResponse = { items };
  return jsonResponse(response);
});


