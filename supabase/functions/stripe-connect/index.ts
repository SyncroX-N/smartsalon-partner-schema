import { createClient } from "supabase";
import Stripe from "stripe";

// Minimal CORS headers like other functions
const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StripeAccountCapabilities {
  card_payments?: "active" | "inactive" | "pending";
  transfers?: "active" | "inactive" | "pending";
}

interface StripeAccountUpdatedEvent {
  type: "account.updated";
  data: {
    object: {
      id: string;
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      details_submitted?: boolean;
      capabilities?: StripeAccountCapabilities;
      requirements?: {
        disabled_reason?: string | null;
        currently_due?: string[];
        eventually_due?: string[];
        past_due?: string[];
        pending_verification?: string[];
      };
    };
  };
}

interface StripeCapabilityUpdatedEvent {
  type: "capability.updated";
  data: { object: { account: string; id: string; status: string } };
}

type StripeEvent =
  | StripeAccountUpdatedEvent
  | StripeCapabilityUpdatedEvent
  | { type: string; data: { object: any } };

function extractFlagsFromAccount(account: {
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  capabilities?: StripeAccountCapabilities;
  details_submitted?: boolean;
  requirements?: {
    disabled_reason?: string | null;
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
    pending_verification?: string[];
  };
}) {
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);
  const requirements = account.requirements ?? {};
  const onboardingStatus = deriveOnboardingStatus({
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    requirements,
  });
  return {
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requirements,
    onboardingStatus,
  };
}

function deriveOnboardingStatus(a: {
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    disabled_reason?: string | null;
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
    pending_verification?: string[];
  };
}):
  | "NOT_CREATED"
  | "REQUIRES_ACTION"
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "RESTRICTED" {
  if (a.charges_enabled && a.payouts_enabled) return "ACTIVE";
  if (a.requirements?.disabled_reason) return "RESTRICTED";
  if (
    (a.requirements?.currently_due?.length ?? 0) > 0 ||
    (a.requirements?.past_due?.length ?? 0) > 0
  )
    return "REQUIRES_ACTION";
  if ((a.requirements?.pending_verification?.length ?? 0) > 0)
    return "PENDING_VERIFICATION";
  return "REQUIRES_ACTION";
}

async function updateCompanyFlagsByAccountId(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripeAccountId: string,
  flags: {
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    onboardingStatus?:
      | "NOT_CREATED"
      | "REQUIRES_ACTION"
      | "PENDING_VERIFICATION"
      | "ACTIVE"
      | "RESTRICTED";
    requirements?: {
      disabled_reason?: string | null;
      currently_due?: string[];
      eventually_due?: string[];
      past_due?: string[];
      pending_verification?: string[];
    };
    cardPaymentsCapability?: "active" | "inactive" | "pending";
    transfersCapability?: "active" | "inactive" | "pending";
  }
) {
  const update: Record<string, unknown> = {};
  if (typeof flags.chargesEnabled === "boolean")
    update.chargesEnabled = flags.chargesEnabled;
  if (typeof flags.payoutsEnabled === "boolean")
    update.payoutsEnabled = flags.payoutsEnabled;
  if (typeof flags.detailsSubmitted === "boolean")
    update.stripeDetailsSubmitted = flags.detailsSubmitted;
  if (flags.onboardingStatus)
    update.stripeOnboardingStatus = flags.onboardingStatus;
  if (flags.requirements) {
    update.stripeRequirementsDue = {
      currentlyDue: flags.requirements.currently_due ?? [],
      eventuallyDue: flags.requirements.eventually_due ?? [],
      pastDue: flags.requirements.past_due ?? [],
      pendingVerification: flags.requirements.pending_verification ?? [],
      disabledReason: flags.requirements.disabled_reason ?? null,
    };
  }
  if (flags.cardPaymentsCapability)
    update.stripeCardPaymentsCapability = flags.cardPaymentsCapability;
  if (flags.transfersCapability)
    update.stripeTransfersCapability = flags.transfersCapability;
  if (Object.keys(update).length === 0) return { data: null, error: null };
  return await supabaseAdmin
    .from("Company")
    .update(update)
    .eq("stripeAccountId", stripeAccountId);
}

Deno.serve(async (req) => {
  console.log("=== STRIPE WEBHOOK RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  console.log("Webhook secret present:", !!webhookSecret);
  console.log("Stripe secret present:", !!stripeSecret);
  
  if (!webhookSecret || !stripeSecret) {
    console.error("Missing Stripe environment variables");
    return new Response(JSON.stringify({ error: "Missing Stripe env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  console.log("Signature present:", !!signature);
  console.log("Body length:", rawBody.length);
  
  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Initialize Stripe
  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event: StripeEvent;
  try {
    console.log("Constructing Stripe event...");
    event = (await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    )) as StripeEvent;
    console.log("Event type:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(
      JSON.stringify({
        error: "Invalid signature",
        details: (err as Error).message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
    }
  );

  try {
    console.log("Processing event:", event.type);
    switch (event.type) {
      case "account.updated": {
        const account = (event as StripeAccountUpdatedEvent).data.object;
        console.log("Account ID:", account.id);
        const {
          chargesEnabled,
          payoutsEnabled,
          detailsSubmitted,
          requirements,
          onboardingStatus,
        } = extractFlagsFromAccount(account);
        console.log("Onboarding status:", onboardingStatus);
        const cardPaymentsCapability = account.capabilities?.card_payments;
        const transfersCapability = account.capabilities?.transfers;
        const result = await updateCompanyFlagsByAccountId(supabaseAdmin, account.id, {
          chargesEnabled,
          payoutsEnabled,
          detailsSubmitted,
          onboardingStatus,
          requirements,
          cardPaymentsCapability,
          transfersCapability,
        });
        console.log("Update result:", result.error ? "ERROR" : "SUCCESS", result.error);
        break;
      }
      case "capability.updated": {
        // Fallback: fetch account to compute flags accurately
        const accountId = (event as StripeCapabilityUpdatedEvent).data.object
          .account;
        const account = await stripe.accounts.retrieve(accountId);
        const {
          chargesEnabled,
          payoutsEnabled,
          detailsSubmitted,
          requirements,
          onboardingStatus,
        } = extractFlagsFromAccount(account as any);
        const capabilities = (account as any).capabilities ?? {};
        await updateCompanyFlagsByAccountId(supabaseAdmin, accountId, {
          chargesEnabled,
          payoutsEnabled,
          detailsSubmitted,
          onboardingStatus,
          requirements,
          cardPaymentsCapability: capabilities.card_payments,
          transfersCapability: capabilities.transfers,
        });
        break;
      }
      default: {
        // Ignore unrelated events
      }
    }

    console.log("=== WEBHOOK PROCESSED SUCCESSFULLY ===");
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== WEBHOOK PROCESSING ERROR ===");
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Processing error",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
