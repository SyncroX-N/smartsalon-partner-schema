# Create Stripe Account Link

This Edge Function creates a Stripe Connect Express account link for company onboarding.

## Usage

### Request
```typescript
POST /functions/v1/create-stripe-account-link
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "companyId": "uuid",
  "returnUrl": "https://yourapp.com/stripe/return"
}
```

### Response
```typescript
{
  "url": "https://connect.stripe.com/setup/c/...",
  "expires_at": 1234567890
}
```

## Environment Variables Required

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

## How it works

1. Verifies the user is authenticated and has access to the company
2. Creates a Stripe Express account if one doesn't exist
3. Generates an account link for onboarding
4. Updates the company record with the Stripe account ID

## Error Handling

- 401: Unauthorized (invalid or missing JWT)
- 400: Missing required fields
- 403: User doesn't have access to the company
- 404: Company not found
- 500: Internal server error
