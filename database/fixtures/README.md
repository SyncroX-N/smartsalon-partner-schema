# Database Fixtures

This directory contains scripts to seed test data for development and testing purposes, including customers, service categories, and services.

## Available Scripts

### Service Management

#### 1. Create General Service Structure (`create-macro-service-structure.ts`)

Creates global service categories and services that all locations can reference.

**Create the general structure:**
```bash
cd database
npm run db:create-macro-services
```

**List existing general structure:**
```bash
npm run db:list-macro-services
```

**What it creates:**
- General service categories (Hair Services, Nail Services, etc.)
- General services (Haircuts, Hair Coloring, Manicures, etc.)
- Standardized service taxonomy for all locations
- Foundation for location-specific services

**Cleanup:**
```bash
npm run db:cleanup-macro-services
```

#### 2. Create Location-Specific Services (`create-location-services.ts`)

Creates location-specific services linked to the general services.

**Create location services:**
```bash
npm run db:create-location-services
```

**List available general services:**
```bash
npm run db:list-available-general-services
```

**What it creates:**
- Location-specific service categories (LocationServiceCategory)
- Location services (LocationService) with custom pricing and durations
- Links location services to general services via serviceTypeId
- Enables filtering locations by general service types

**Cleanup:**
```bash
npm run db:cleanup-location-services
```

### Customer Management

#### 1. Create Mock Customers (`create-mock-customers.ts`) - **RECOMMENDED**

Creates complete mock customers including auth records for development/testing.

**Run:**
```bash
cd database
npm run fixtures:mock-customers
```

**What it does:**
- Creates 8 mock users in `auth.users` table (Supabase auth)
- Creates corresponding records in your `User` table
- Associates them with company ID: `81e0a4cb-2237-49ef-b0ba-5c43782594bd`
- Adds customer tags and notes for each relationship
- ⚠️ **Development only** - directly manipulates auth.users

**Cleanup:**
```bash
npm run fixtures:cleanup-mocks
```

### 2. Seed Existing Customers (`customers.ts`)

Works with existing authenticated users to create company relationships.

**Run:**
```bash
cd database
npm run fixtures:customers
```

**What it does:**
- Finds existing customers in your database
- Associates them with the specified company
- Adds customer tags and notes for each relationship
- Requires users to already exist in Supabase auth

### 3. Query Customers (`query-customers.ts`)

Displays all customers associated with the company along with their details and statistics.

**Run:**
```bash
cd database
npm run query:customers
```

**What it shows:**
- Company information
- List of all customers with their details
- Customer tags and notes
- Summary statistics (active/inactive counts, tag breakdown)

## Sample Data

The fixtures create customers with the following profiles:

1. **John Smith** - Regular customer, prefers morning appointments
2. **Maria Garcia** - VIP customer, always books premium services
3. **David Johnson** - New customer, referred by John Smith
4. **Sarah Wilson** - Frequent customer, books weekly appointments
5. **Michael Brown** - Business customer, expense account
6. **Emma Davis** - Student discount customer
7. **James Miller** - Prefers specific barber (Alex)
8. **Lisa Anderson** - Seasonal customer, only during holidays

## Customer Tags

The fixtures use various tags to categorize customers:
- `regular`, `vip`, `new`, `frequent`
- `business`, `student`, `seasonal`
- `morning-preferred`, `weekly`, `referral`
- `premium`, `expense-account`, `discount`
- `specific-barber`, `alex`, `holidays`

## Prerequisites

1. Make sure your `.env` file is configured with `DATABASE_URL`
2. Ensure the company with ID `81e0a4cb-2237-49ef-b0ba-5c43782594bd` exists in your database
3. Run database migrations first if you haven't already

## Customization

To use these scripts with a different company:

1. Update the `COMPANY_ID` constant in both files
2. Modify the customer data in `customerFixtures` array
3. Adjust the `companyCustomerFixtures` array with different tags/notes

## Quick Start (Recommended)

For development/testing, use the mock customers approach:

```bash
cd database

# Create mock customers (includes auth records)
npm run fixtures:mock-customers

# Verify they were created
npm run query:customers

# Clean up when done (optional)
npm run fixtures:cleanup-mocks
```

## File Structure

```
fixtures/
├── README.md                              # This file
├── create-service-categories-and-services.ts  # Create service categories & services
├── create-mock-customers.ts               # Create complete mock customers (recommended)
├── customers.ts                           # Work with existing auth users
└── query-customers.ts                     # Query and display customers
```

## Database Schema Updates

Recent schema changes focused on better organization and clearer naming:

### Table Renaming for Clarity

**General Services (Global/Standardized):**
- `MacroServiceCategory` → `ServiceCategory` - Global service categories
- `MacroServiceType` → `Service` - Global service types

**Location-Specific Services:**
- `ServiceCategory` → `LocationServiceCategory` - Location-specific categories
- `Service` → `LocationService` - Location-specific services with custom pricing

### Service Structure

The system now uses a clear two-tier service structure:

1. **General Services**: Global standardization layer
   - `ServiceCategory`: Hair Services, Nail Services, etc.
   - `Service`: Haircuts, Hair Coloring, Manicures, etc.

2. **Location Services**: Custom implementations
   - `LocationServiceCategory`: Location-specific categories
   - `LocationService`: Services with location-specific pricing, linked to general services via `serviceTypeId`

### Other Schema Updates

3. **Location-based Customers** - Customer relationships are now tied to specific locations (`LocationCustomer` instead of `CompanyCustomer`)
4. **Location-based Bookings** - Bookings are now tied to specific locations only (removed `companyId` from bookings)
5. **Better Organization** - Categories and services have display order for proper sorting

### Migration Notes

**Important:** These are breaking changes. Make sure to:
1. Run `npm run db:push` after pulling these schema changes
2. Update any existing queries that reference old table names
3. Update booking queries to remove `companyId` references (bookings now only have `locationId`)
4. Location services now reference general services via `serviceTypeId` instead of `macroServiceTypeId` 