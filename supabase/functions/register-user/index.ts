import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "supabase";
import {
  handleCorsRequest,
  createSuccessResponse,
  createErrorResponse,
} from "cors";

interface RegistrationData {
  type: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  preferredLanguage: string;
  country: string;
  currency: string;
  timezone: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsRequest();
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("Authorization header required", 401);
    }

    // Extract JWT token from header
    const token = authHeader.replace("Bearer ", "");

    // Test environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return createErrorResponse("Server configuration error", 500);
    }

    // Create admin client to verify JWT and get user
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Get user from JWT token using admin client
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      return createErrorResponse(
        `Authentication failed: ${userError.message}`,
        401,
      );
    }

    if (!user) {
      return createErrorResponse("User not found", 401);
    }

    // Parse request body
    let registrationData: RegistrationData;
    try {
      registrationData = await req.json();
    } catch (parseError) {
      return createErrorResponse("Invalid request body", 400);
    }

    // Call the transaction function
    const { data, error } = await supabaseAdmin.rpc(
      "register_user_transaction",
      {
        user_id: user.id,
        user_type: registrationData.type,
        first_name: registrationData.firstName,
        last_name: registrationData.lastName,
        phone_number: registrationData.phoneNumber,
        email: registrationData.email,
        preferred_language: registrationData.preferredLanguage,
        country: registrationData.country,
        currency: registrationData.currency,
        timezone: registrationData.timezone,
      },
    );

    if (error) {
      console.error("Registration transaction failed:", error);
      return createErrorResponse(`Registration failed: ${error.message}`, 400);
    }

    return createSuccessResponse(data);
  } catch (error: unknown) {
    console.error("Unexpected error in register-user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    return createErrorResponse(errorMessage, 500);
  }
});
