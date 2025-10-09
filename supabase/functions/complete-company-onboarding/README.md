# Complete Company Onboarding Function

This function handles company onboarding completion using a **single atomic database transaction** that includes auth metadata updates.

## Overview

Renamed from `update-company-info` to better reflect its purpose - completing the company onboarding process. Uses the same atomic transaction pattern as the `register-user` function.

## Key Improvements

### Before (update-company-info)
- Complex RLS-based security checks
- Separate company update and auth metadata handling
- Manual error handling for permissions
- No atomic guarantee between company data and auth state

### After (complete-company-onboarding)
- Single atomic transaction handles everything
- Auth metadata automatically updated to mark onboarding complete
- Simplified security through database function
- Guaranteed consistency between company data and auth state

## How It Works

**Single Transaction** that includes:
1. **Company Data Update**: Updates all company information
2. **Auth Metadata Update**: Sets `hasCompletedCompanyOnboarding: true`

**All in one atomic PostgreSQL transaction** - if any step fails, everything rolls back automatically.

## Database Function

The `complete_company_onboarding_transaction` PostgreSQL function:
- Updates company record with onboarding data
- Updates auth metadata to mark onboarding as complete
- Returns updated company data as JSON
- **Automatically rolls back ALL changes if any step fails**

## Auth Metadata Update

The function updates the auth metadata to reflect completion:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data::jsonb,
  '{hasCompletedCompanyOnboarding}', 
  'true'::jsonb
)
WHERE id = user_id;
```

Result in client:
```json
{
  "raw_user_meta_data": {
    "firstName": "Alessandro",
    "lastName": "Carpanzano", 
    "phone": "user_phone",
    "hasProfile": true,
    "companyId": "c661c0a1-7e5c-4fb3-bc40-9dbe158c23b7",
    "hasCompletedCompanyOnboarding": true
  }
}
```

## Input Format

Expects the same onboarding data format:

```json
{
  "accountType": "BUSINESS",
  "businessName": "Test Company",
  "services": ["HAIR_SALON", "NAILS", "EYEBROWS_AND_LASHES"],
  "teamSize": "+11",
  "website": "https://example.com"
}
```

## Service Mapping

- First service becomes `mainSpecialisation`
- Remaining services become `secondarySpecialisations` array

## Benefits

- **True Atomicity**: Company data + auth metadata in single transaction
- **No Partial State**: Impossible to have inconsistent onboarding state
- **Simpler Code**: Single function call, no manual coordination
- **Better Performance**: One database round-trip for everything
- **Guaranteed Consistency**: Company data and auth always in sync
- **Clean Error Handling**: Single point of failure with automatic rollback

## Security

- Only `COMPANY_ADMIN` users can complete onboarding
- Company ID taken from user's auth metadata (not client input)
- Database function ensures data integrity
- RLS policies still apply for additional security

## Usage

```typescript
const { data, error } = await supabaseAdmin.rpc('complete_company_onboarding_transaction', {
  user_id: user.id,
  company_id: companyId,
  business_name: 'Test Company',
  // ... other fields
});

// Either everything succeeded or everything failed
// Client immediately has updated auth metadata
``` 