# Security Implementation Guide

This document outlines the security measures implemented to ensure data isolation between companies and proper access control.

## 🔒 **RLS-First Security Approach**

We use **Row Level Security (RLS)** as the primary security mechanism, which is Supabase's recommended approach for multi-tenant applications.

### Why RLS is Better Than Application-Level Security

1. **Database-level enforcement** - Security is enforced at the PostgreSQL level, not just in application code
2. **Cannot be bypassed** - Even direct database access is protected
3. **Automatic with Supabase Auth** - Works seamlessly with `auth.uid()` 
4. **Performance** - No additional queries needed for security checks
5. **Bulletproof** - Impossible to accidentally forget security checks

## 🏗️ **How It Works**

### 1. **Authentication**
- Users authenticate through Supabase Auth
- JWT token contains the user ID (`auth.uid()`)
- This user ID is automatically available in RLS policies

### 2. **Authorization (RLS Policies)**
- Each table has policies that reference `auth.uid()`
- Policies automatically filter data based on company membership
- Only company admins can update company information

### 3. **Edge Functions**
- Edge Functions only need to pass the JWT token to Supabase
- RLS policies automatically enforce all security rules
- Minimal security code needed in functions

## 🔧 **Implementation**

### Edge Function Security (Simplified)
```typescript
// Create client with user's JWT - RLS handles the rest
const supabaseClient = createClient<Database>(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  {
    global: {
      headers: { Authorization: authHeader },
    },
  }
);

// This update is automatically secured by RLS
const { data, error } = await supabaseClient
  .from("Company")
  .update(updateData)
  .eq("id", companyId); // RLS ensures user can only update their company
```

### RLS Policy Example
```sql
-- Only company admins can update company info
CREATE POLICY "Company admins can update company" ON "Company"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND type = 'COMPANY_ADMIN'
      AND companyId = "Company".id
    )
  );
```

## 🛡️ **Security Guarantees**

### Company Data Isolation
- ✅ Users can only see data from their own company
- ✅ Company admins cannot access other companies' data
- ✅ Customers can see their bookings across companies
- ✅ No data leakage between companies is possible

### Role-Based Access
- ✅ Only `COMPANY_ADMIN` can update company information
- ✅ `COMPANY_EMPLOYEE` can manage bookings but not company settings
- ✅ `CUSTOMER` can only access their own bookings

### Automatic Enforcement
- ✅ All database operations are automatically secured
- ✅ No way to accidentally bypass security
- ✅ Works with direct SQL queries too

## 📊 **RLS Policies Overview**

| Table | Policy | Who | What |
|-------|--------|-----|------|
| **Company** | Read own company | All users | Can read their company's data |
| **Company** | Update company | Company Admin | Can update their company only |
| **User** | Read own record | All users | Can read their own user record |
| **User** | Read company users | Company Admin | Can read users in their company |
| **Booking** | Read company bookings | Company users | Can read bookings for their company |
| **Booking** | Read own bookings | Customers | Can read their own bookings across companies |
| **Service** | Manage services | Company Admin | Can manage services for their company |

## 🚀 **Benefits**

### For Developers
- **Simple code** - No complex security logic in functions
- **Bulletproof** - Impossible to forget security checks
- **Performance** - No extra queries for authorization
- **Maintainable** - Security rules are centralized in the database

### For Security
- **Defense in depth** - Database-level protection
- **Audit trail** - All access is logged by PostgreSQL
- **Compliance** - Meets data isolation requirements
- **Scalable** - Handles any number of companies automatically

## 🧪 **Testing Security**

### How to Verify RLS is Working

1. **Test with different users:**
   ```sql
   -- This should only return the user's own company
   SELECT * FROM "Company";
   ```

2. **Try unauthorized operations:**
   ```sql
   -- This should fail or return no results
   UPDATE "Company" SET businessName = 'Hacked' WHERE id = 'other-company-id';
   ```

3. **Check policy violations:**
   - Attempts to access other companies' data should return empty results
   - Unauthorized updates should fail with policy violations

## 📝 **Best Practices**

### Edge Functions
1. ✅ Always pass the Authorization header to Supabase client
2. ✅ Let RLS handle security - don't duplicate checks
3. ✅ Only add business logic validations, not security validations
4. ✅ Trust the RLS policies to enforce data isolation

### RLS Policies
1. ✅ Use `auth.uid()` to identify the current user
2. ✅ Join with User table to get company membership
3. ✅ Be explicit about operations (SELECT, INSERT, UPDATE, DELETE)
4. ✅ Test policies thoroughly with different user types

## 🔗 **References**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Multi-tenant Guide](https://supabase.com/docs/guides/resources/examples#todo-list) 