import { createClient } from "supabase";
import Stripe from "stripe";
import { corsHeaders } from "cors";

export interface AuthContext {
  supabaseAdmin: ReturnType<typeof createClient>;
  userId: string;
}

export function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function getAuthContext(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Authorization header required" }, 401);
  const token = authHeader.replace("Bearer ", "");

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return jsonResponse({ error: "Invalid user" }, 401);
  return { supabaseAdmin, userId: data.user.id };
}

export async function assertCanManageSales(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  locationId: string,
): Promise<Response | void> {
  const { data, error } = await supabaseAdmin
    .from("UserLocationAccess")
    .select("permissions")
    .eq("userId", userId)
    .eq("locationId", locationId)
    .maybeSingle();

  if (error) return jsonResponse({ error: `Permission check failed: ${error.message}` }, 500);
  const canManageSales = Boolean((data as any)?.permissions?.canManageSales);
  if (!data || !canManageSales) return jsonResponse({ error: "Forbidden: missing canManageSales" }, 403);
}

export async function getStripeAccountIdByLocation(
  supabaseAdmin: ReturnType<typeof createClient>,
  locationId: string,
): Promise<string | Response> {
  const { data: loc, error: locErr } = await supabaseAdmin
    .from("Location")
    .select("companyId")
    .eq("id", locationId)
    .single();
  if (locErr || !loc) return jsonResponse({ error: "Location not found" }, 404);

  const { data: company, error: compErr } = await supabaseAdmin
    .from("Company")
    .select("stripeAccountId")
    .eq("id", loc.companyId)
    .single();
  if (compErr || !company) return jsonResponse({ error: "Company not found" }, 404);
  if (!company.stripeAccountId)
    return jsonResponse({ error: "Stripe account not connected" }, 400);
  return company.stripeAccountId as string;
}

export function getStripe(): Stripe | Response {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return jsonResponse({ error: "Missing STRIPE_SECRET_KEY" }, 500);
  return new Stripe(key, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}


