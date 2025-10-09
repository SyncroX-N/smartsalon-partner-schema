/**
 * Simple security utilities for Supabase Edge Functions
 * Most security is handled by RLS policies - these are just helper functions
 */

import { createClient, SupabaseClient } from "supabase";
import type { Database } from "./types";

/**
 * Creates a Supabase client with user authentication context
 * RLS policies will automatically enforce security
 */
export function createAuthenticatedSupabaseClient(authHeader: string) {
  return createClient<Database>(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    },
  );
}

/**
 * Gets the current user and their basic info
 * Returns null if not authenticated
 */
export async function getCurrentUser(supabaseClient: SupabaseClient<Database>) {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user record from database (RLS will ensure they can only see their own record)
  const { data: userRecord, error: userError } = await supabaseClient
    .from("User")
    .select("id, type, companyId, locationId")
    .eq("id", user.id)
    .single();

  if (userError || !userRecord) {
    return null;
  }

  return {
    authUser: user,
    userRecord,
  };
}

/**
 * Checks if the current user is a company admin
 */
export function isCompanyAdmin(
  userRecord: Database["public"]["Tables"]["User"]["Row"],
): boolean {
  return userRecord.type === "COMPANY_ADMIN";
}

/**
 * Checks if the current user is associated with a company
 */
export function hasCompany(
  userRecord: Database["public"]["Tables"]["User"]["Row"],
): boolean {
  return userRecord.companyId !== null;
}
