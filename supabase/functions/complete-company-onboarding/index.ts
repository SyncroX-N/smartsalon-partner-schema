import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function handleCorsRequest() {
  return new Response("ok", { headers: corsHeaders });
}

function createSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface CompanyOnboardingData {
  type: string;
  businessName: string;
  mainSpecialisation: string;
  secondarySpecialisations: string[];
  size?: string;
  website?: string;
  // Location data
  address?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  streetNumber?: string;
  route?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  placeTypes?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsRequest();
  }

  // Only allow POST, PUT and PATCH methods
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH") {
    return createErrorResponse(
      "Method not allowed. Use POST, PUT or PATCH.",
      405
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("Authorization header required", 401);
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
      return createErrorResponse("User not found", 401);
    }

    // Check if user is company admin
    if (user.user_metadata?.type !== "COMPANY_ADMIN") {
      return createErrorResponse(
        "Only company administrators can complete company onboarding",
        403
      );
    }

    // Get company ID from auth metadata
    const companyId = user.user_metadata?.companyId;
    if (!companyId) {
      return createErrorResponse("Company ID not found in user profile", 400);
    }

    // Parse request body
    const onboardingData: CompanyOnboardingData = await req.json();

    // Debug: Log the parameters being sent
    console.log("Company ID:", companyId);
    console.log("Onboarding data:", JSON.stringify(onboardingData, null, 2));

    // Execute everything in a single atomic transaction
    // This includes: company data update + location creation + auth metadata update
    const { data, error } = await supabaseAdmin.rpc(
      "complete_company_onboarding_transaction",
      {
        p_account_type: onboardingData.type,
        p_business_name: onboardingData.businessName,
        p_company_id: companyId,
        p_main_specialisation: onboardingData.mainSpecialisation,
        p_secondary_specialisations: onboardingData.secondarySpecialisations,
        p_user_id: user.id,
        p_team_size: onboardingData.size,
        p_website: onboardingData.website,
        // Location parameters
        p_address: onboardingData.address,
        p_place_id: onboardingData.placeId,
        p_latitude: onboardingData.latitude,
        p_longitude: onboardingData.longitude,
        p_street_number: onboardingData.streetNumber,
        p_route: onboardingData.route,
        p_city: onboardingData.city,
        p_state: onboardingData.state,
        p_country: onboardingData.country,
        p_country_code: onboardingData.countryCode,
        p_postal_code: onboardingData.postalCode,
        p_place_types: onboardingData.placeTypes,
      }
    );

    console.log("RPC response - data:", data);
    console.log("RPC response - error:", JSON.stringify(error, null, 2));

    if (error) {
      console.error("Company onboarding transaction failed:", error);
      return createErrorResponse("Company onboarding failed: " + error.message);
    }

    return createSuccessResponse(data);
  } catch (error: unknown) {
    console.error("Error in complete-company-onboarding:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Company onboarding failed";
    return createErrorResponse(errorMessage);
  }
});
