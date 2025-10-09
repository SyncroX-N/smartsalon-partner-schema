-- Migration: Add complete_company_onboarding_transaction function
-- This function handles company onboarding completion in a single atomic transaction
-- Including auth metadata updates and location creation

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS complete_company_onboarding_transaction(text,text,uuid,text,text[],text[],text,uuid,text);

CREATE OR REPLACE FUNCTION complete_company_onboarding_transaction(
  p_account_type TEXT,
  p_business_name TEXT,
  p_company_id UUID,
  p_main_specialisation TEXT,
  p_secondary_specialisations TEXT[],
  p_user_id UUID,
  p_team_size TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  -- Location parameters
  p_address TEXT DEFAULT NULL,
  p_place_id TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_street_number TEXT DEFAULT NULL,
  p_route TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_place_types TEXT[] DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  company_record RECORD;
  location_record RECORD;
  result JSON;
BEGIN
  -- Step 1: Update company information (using correct column names from schema)
  UPDATE "Company"
  SET 
    "businessName" = p_business_name,
    "type" = p_account_type::"CompanyType",
    "mainSpecialisation" = p_main_specialisation::"CompanySpecialisation",
    "secondarySpecialisations" = p_secondary_specialisations::"CompanySpecialisation"[],
    "size" = CASE WHEN p_team_size IS NOT NULL THEN p_team_size::"CompanySize" ELSE "size" END,
    "website" = p_website,
    "updatedAt" = NOW()
  WHERE id = p_company_id
  RETURNING * INTO company_record;
  
  -- Check if company was found and updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found or access denied';
  END IF;
  
  -- Step 2: Create default location for the company
  INSERT INTO "Location" (
    "companyId",
    "name",
    "address",
    "placeId",
    "latitude",
    "longitude",
    "streetNumber",
    "route",
    "city",
    "state",
    "country",
    "countryCode",
    "postalCode",
    "placeTypes"
  )
  VALUES (
    p_company_id,
    p_business_name, -- Use business name as default location name
    p_address,
    p_place_id,
    p_latitude,
    p_longitude,
    p_street_number,
    p_route,
    p_city,
    p_state,
    p_country,
    p_country_code,
    p_postal_code,
    p_place_types
  )
  RETURNING * INTO location_record;
  
  -- Step 3: Update auth metadata to mark onboarding as complete
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb),
    '{hasCompletedCompanyOnboarding}', 
    'true'::jsonb
  )
  WHERE id = p_user_id;
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'company', row_to_json(company_record),
    'location', row_to_json(location_record),
    'message', 'Company onboarding completed successfully'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback the entire transaction
    -- including auth metadata updates and location creation
    RAISE EXCEPTION 'Company onboarding failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 