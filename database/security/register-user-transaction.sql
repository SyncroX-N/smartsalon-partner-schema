-- PostgreSQL function to handle user registration in a single transaction
-- This ensures atomicity - if any step fails, everything rolls back
-- Including auth metadata updates

CREATE OR REPLACE FUNCTION register_user_transaction(
  user_id UUID,
  user_type TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  email TEXT,
  preferred_language TEXT,
  country TEXT,
  currency TEXT,
  timezone TEXT
) RETURNS JSON AS $$
DECLARE
  company_record RECORD;
  user_record RECORD;
  result JSON;
BEGIN
  -- Step 1: Create company first
  INSERT INTO "Company" (country, currency, timezone)
  VALUES (country, currency, timezone)
  RETURNING * INTO company_record;
  
  -- Step 2: Update auth metadata with all profile info including companyId and type
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb),
                '{firstName}', to_jsonb(first_name)
              ),
              '{lastName}', to_jsonb(last_name)
            ),
            '{phone}', to_jsonb(phone_number)
          ),
          '{hasProfile}', 'true'::jsonb
        ),
        '{companyId}', to_jsonb(company_record.id::text)
      ),
      '{hasCompletedCompanyOnboarding}', 'false'::jsonb
    ),
    '{type}', to_jsonb(user_type)
  )
  WHERE id = user_id;
  
  -- Step 3: Create user record
  INSERT INTO "User" (
    id,
    "companyId",
    "phoneNumber",
    "firstName",
    "lastName",
    email,
    "preferredLanguage",
    type
  )
  VALUES (
    user_id,
    company_record.id,
    phone_number,
    first_name,
    last_name,
    email,
    preferred_language,
    user_type::"UserType"
  )
  RETURNING * INTO user_record;
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'company_id', company_record.id,
    'user', row_to_json(user_record),
    'company', row_to_json(company_record)
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback the entire transaction
    -- including auth metadata updates
    RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 