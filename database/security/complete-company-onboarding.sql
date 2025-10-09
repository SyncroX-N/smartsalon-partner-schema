-- Migration: Add complete_company_onboarding_transaction function
-- This function handles company onboarding completion in a single atomic transaction
-- Including auth metadata updates

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS complete_company_onboarding_transaction(text,text,uuid,text,text[],text[],text,uuid,text);

CREATE OR REPLACE FUNCTION complete_company_onboarding_transaction(
  p_account_type TEXT,
  p_business_name TEXT,
  p_company_id UUID,
  p_main_specialisation TEXT,
  p_secondary_specialisations TEXT[],
  p_service_locations TEXT[],
  p_team_size TEXT DEFAULT '2_5',
  p_user_id UUID,
  p_website TEXT
) RETURNS JSON AS $$
DECLARE
  company_record RECORD;
  result JSON;
BEGIN
  -- Step 1: Update company information (using correct column names from schema)
  UPDATE "Company"
  SET 
    "businessName" = p_business_name,
    "type" = p_account_type::"CompanyType",
    "mainSpecialisation" = p_main_specialisation::"CompanySpecialisation",
    "secondarySpecialisations" = p_secondary_specialisations::"CompanySpecialisation"[],
    "size" = p_team_size::"CompanySize",
    "website" = p_website,
    "servicesLocation" = p_service_locations[1]::"CompanyServicesLocation",
    "updatedAt" = NOW()
  WHERE id = p_company_id
  RETURNING * INTO company_record;
  
  -- Check if company was found and updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found or access denied';
  END IF;
  
  -- Step 2: Update auth metadata to mark onboarding as complete
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
    'message', 'Company onboarding completed successfully'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback the entire transaction
    -- including auth metadata updates
    RAISE EXCEPTION 'Company onboarding failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;