# Supabase Edge Functions Setup

This project uses **Deno** for Edge Functions with modern best practices.

## Prerequisites

1. **Install Deno Extension** for VSCode:
   - Open VSCode
   - Install "Deno" extension by Denoland
   - Reload VSCode

2. **Verify VSCode Settings**:
   The `.vscode/settings.json` file is configured to:
   - Enable Deno for `supabase/functions` folder only
   - Use the shared `deno.json` config
   - Format TypeScript files with Deno

## Project Structure

```
supabase/functions/
├── deno.json                    # Shared Deno configuration
├── _shared/                     # Shared utilities
│   ├── cors.ts
│   ├── security.ts
│   └── types.ts
└── [function-name]/
    ├── deno.json                # Function-specific dependencies
    └── index.ts                 # Function code
```

## Function Dependencies

Each function has its own `deno.json` file that specifies its dependencies using npm: imports:

```json
{
  "imports": {
    "supabase": "npm:@supabase/supabase-js@2",
    "stripe": "npm:stripe@17",
    "zod": "npm:zod@3"
  }
}
```

## Common Patterns

### 1. Import Statements

```typescript
import { createClient } from "supabase";
import Stripe from "stripe";
import { z } from "zod";
```

### 2. Deno.serve (not serve)

```typescript
Deno.serve(async (req) => {
  // Your code here
});
```

### 3. Always use `persistSession: false`

```typescript
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      persistSession: false, // ← Important for Edge Functions!
    },
  }
);
```

## Troubleshooting TypeScript Errors

If you see errors like:
- `Cannot find module 'supabase'`
- `Cannot find name 'Deno'`

**Solutions:**
1. Reload VSCode window (Cmd+Shift+P → "Reload Window")
2. Make sure Deno extension is installed and enabled
3. Check that `.vscode/settings.json` exists
4. Verify each function has its own `deno.json`

## Deployment

Deploy individual function:
```bash
supabase functions deploy [function-name] --project-ref [your-ref]
```

Deploy all functions:
```bash
supabase functions deploy --project-ref [your-ref]
```

## Functions List

- ✅ `create-stripe-account-link` - Creates Stripe Connect account links
- ✅ `complete-company-onboarding` - Completes company onboarding
- ✅ `register-user` - Registers new users
- ✅ `create-booking` - Creates bookings with validation
- ✅ `stripe-connect` - Stripe webhook handler
- ✅ `supabase-self-delete` - User self-deletion
- ⚠️ `compute-timeslots` - (Not migrated, uses direct imports)

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Managing Dependencies](https://supabase.com/docs/guides/functions/dependencies)
- [Deno Documentation](https://deno.land/manual)

