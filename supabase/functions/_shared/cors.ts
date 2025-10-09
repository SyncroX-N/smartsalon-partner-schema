/**
 * CORS utilities for Supabase Edge Functions
 * Based on Supabase documentation best practices
 * @see https://supabase.com/docs/guides/functions/development-tips
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsRequest(): Response {
  return new Response("ok", { headers: corsHeaders });
}

/**
 * Create a response with CORS headers
 */
export function createResponse(body: any, init?: ResponseInit): Response {
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    ...init,
    headers,
  });
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 400,
): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  return createResponse({ error: errorMessage }, { status });
}

/**
 * Create a success response with CORS headers
 */
export function createSuccessResponse(
  data: any,
  status: number = 200,
): Response {
  return createResponse({ success: true, data }, { status });
}
