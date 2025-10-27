import { createClient } from "supabase";
import Stripe from "stripe";

interface CreateAccountLinkRequest {
  companyId: string;
  returnUrl: string;
}

interface StripeAccountLinkResponse {
  url: string;
  expires_at: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== FUNCTION STARTED ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);

    // Check environment variables
    console.log("=== ENVIRONMENT VARIABLES ===");
    console.log(
      "SUPABASE_URL:",
      Deno.env.get("SUPABASE_URL") ? "SET" : "NOT_SET"
    );
    console.log(
      "SUPABASE_ANON_KEY:",
      Deno.env.get("SUPABASE_ANON_KEY") ? "SET" : "NOT_SET"
    );
    console.log(
      "STRIPE_SECRET_KEY:",
      Deno.env.get("STRIPE_SECRET_KEY") ? "SET" : "NOT_SET"
    );
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY:",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "SET" : "NOT_SET"
    );
    // Initialize Supabase client
    console.log("=== INITIALIZING SUPABASE CLIENT ===");
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    console.log("Auth header value:", authHeader?.substring(0, 20) + "...");

    if (!authHeader) {
      console.log("No Authorization header provided");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract JWT token from header
    const token = authHeader.replace("Bearer ", "");

    // Create admin client to verify JWT and get user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get user from JWT token using admin client
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.log("Authentication failed:", userError);
      return new Response(
        JSON.stringify({
          error: "User not found",
          details: userError?.message,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("User authenticated successfully:", user.id);

    // Parse request body
    console.log("=== PARSING REQUEST BODY ===");
    const { companyId, returnUrl }: CreateAccountLinkRequest = await req.json();
    console.log("Request body parsed:", { companyId, returnUrl });

    if (!companyId || !returnUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: companyId, returnUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user has access to this company
    const { data: company, error: companyError } = await supabaseAdmin
      .from("Company")
      .select("id, stripeAccountId")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is associated with this company
    const { data: userCompany, error: userCompanyError } = await supabaseAdmin
      .from("User")
      .select("companyId")
      .eq("id", user.id)
      .eq("companyId", companyId)
      .single();

    if (userCompanyError || !userCompany) {
      return new Response(
        JSON.stringify({ error: "You don't have access to this company" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    console.log("=== INITIALIZING STRIPE ===");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });
    console.log("Stripe initialized successfully");

    let stripeAccountId = company.stripeAccountId;

    // Create Stripe account if it doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // You might want to make this configurable
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      // Update company with Stripe account ID
      const { error: updateError } = await supabaseAdmin
        .from("Company")
        .update({ stripeAccountId })
        .eq("id", companyId);

      if (updateError) {
        console.error(
          "Error updating company with Stripe account ID:",
          updateError
        );
        return new Response(
          JSON.stringify({
            error: "Failed to update company with Stripe account",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create account link (this will resume if onboarding is incomplete)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      return_url: returnUrl,
      refresh_url: returnUrl, // Use the same URL for refresh
      type: "account_onboarding", // This automatically resumes incomplete onboarding
    });

    const response: StripeAccountLinkResponse = {
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== FUNCTION ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
        type: error.constructor.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
