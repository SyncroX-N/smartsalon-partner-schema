import { db } from "../db/index";
import { user, locationCustomer } from "../db/schema";
import { sql } from "drizzle-orm";

const COMPANY_ID = "81e0a4cb-2237-49ef-b0ba-5c43782594bd";
const LOCATION_ID = "3909680c-6ee8-4b22-86f6-b68a54477042";

// Mock customer data with predefined UUIDs
const mockCustomers = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "john.smith@email.com",
    firstName: "John",
    lastName: "Smith",
    phoneNumber: "+1234567890",
    preferredLanguage: "en",
    notes: "Regular customer, prefers morning appointments",
    tags: ["regular", "morning-preferred"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    email: "maria.garcia@email.com",
    firstName: "Maria",
    lastName: "Garcia",
    phoneNumber: "+1234567891",
    preferredLanguage: "es",
    notes: "VIP customer, always books premium services",
    tags: ["vip", "premium"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    email: "david.johnson@email.com",
    firstName: "David",
    lastName: "Johnson",
    phoneNumber: "+1234567892",
    preferredLanguage: "en",
    notes: "New customer, referred by John Smith",
    tags: ["new", "referral"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    email: "sarah.wilson@email.com",
    firstName: "Sarah",
    lastName: "Wilson",
    phoneNumber: "+1234567893",
    preferredLanguage: "en",
    notes: "Frequent customer, books weekly appointments",
    tags: ["frequent", "weekly"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    email: "michael.brown@email.com",
    firstName: "Michael",
    lastName: "Brown",
    phoneNumber: "+1234567894",
    preferredLanguage: "en",
    notes: "Business customer, expense account",
    tags: ["business", "expense-account"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    email: "emma.davis@email.com",
    firstName: "Emma",
    lastName: "Davis",
    phoneNumber: "+1234567895",
    preferredLanguage: "en",
    notes: "Student discount customer",
    tags: ["student", "discount"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    email: "james.miller@email.com",
    firstName: "James",
    lastName: "Miller",
    phoneNumber: "+1234567896",
    preferredLanguage: "en",
    notes: "Prefers specific barber (Alex)",
    tags: ["specific-barber", "alex"],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    email: "lisa.anderson@email.com",
    firstName: "Lisa",
    lastName: "Anderson",
    phoneNumber: "+1234567897",
    preferredLanguage: "en",
    notes: "Seasonal customer, only during holidays",
    tags: ["seasonal", "holidays"],
  },
];

async function createMockCustomers() {
  try {
    console.log("🌱 Creating mock customers for development...");
    console.log("⚠️  WARNING: This script directly inserts into auth.users");
    console.log("   Only use this for development/testing purposes!");
    console.log("");

    // Step 1: Insert mock users into auth.users table
    console.log("👤 Creating mock auth users...");

    for (const customer of mockCustomers) {
      try {
        await db.execute(sql`
          INSERT INTO auth.users (
            id, 
            email, 
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
          ) VALUES (
            ${customer.id}::uuid,
            ${customer.email},
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated'
          )
          ON CONFLICT (id) DO NOTHING
        `);
        console.log(`  ✅ Created auth user: ${customer.email}`);
      } catch (error) {
        console.log(`  ⚠️  Auth user ${customer.email} may already exist`);
      }
    }

    // Step 2: Insert users into our User table
    console.log("\n📝 Creating User records...");
    const userRecords = mockCustomers.map((customer) => ({
      id: customer.id,
      type: "CUSTOMER" as const,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      preferredLanguage: customer.preferredLanguage,
    }));

    await db.insert(user).values(userRecords).onConflictDoNothing();
    console.log(`✅ Created ${userRecords.length} User records`);

    // Step 3: Create location-customer relationships
    console.log("\n🔗 Creating location-customer relationships...");
    const locationCustomerRecords = mockCustomers.map((customer) => ({
      locationId: LOCATION_ID,
      customerId: customer.id,
      notes: customer.notes,
      tags: customer.tags,
      isActive: true,
    }));

    await db
      .insert(locationCustomer)
      .values(locationCustomerRecords)
      .onConflictDoNothing();
    console.log(
      `✅ Created ${locationCustomerRecords.length} location-customer relationships`
    );

    console.log("\n🎉 Mock customers created successfully!");
    console.log("\nCustomer Summary:");
    console.log("================");

    mockCustomers.forEach((customer) => {
      console.log(`${customer.firstName} ${customer.lastName}`);
      console.log(`  📧 Email: ${customer.email}`);
      console.log(`  📱 Phone: ${customer.phoneNumber}`);
      console.log(`  🏷️  Tags: ${customer.tags.join(", ")}`);
      console.log(`  📝 Notes: ${customer.notes}`);
      console.log(`  🆔 ID: ${customer.id}`);
      console.log("");
    });

    console.log("💡 These customers can now be used for:");
    console.log("   - Creating bookings");
    console.log("   - Testing customer management features");
    console.log("   - Development and testing workflows");
  } catch (error) {
    console.error("❌ Error creating mock customers:", error);
    throw error;
  }
}

async function cleanupMockCustomers() {
  try {
    console.log("🧹 Cleaning up mock customers...");

    const customerIds = mockCustomers.map((c) => c.id);

    // Delete location-customer relationships
    await db.execute(sql`
      DELETE FROM "LocationCustomer" 
      WHERE "customerId" = ANY(${customerIds})
    `);

    // Delete from User table
    await db.execute(sql`
      DELETE FROM "User" 
      WHERE id = ANY(${customerIds})
    `);

    // Delete from auth.users
    await db.execute(sql`
      DELETE FROM auth.users 
      WHERE id = ANY(${customerIds})
    `);

    console.log("✅ Mock customers cleaned up successfully!");
  } catch (error) {
    console.error("❌ Error cleaning up mock customers:", error);
    throw error;
  }
}

// Run based on command line argument
if (require.main === module) {
  const action = process.argv[2];

  if (action === "cleanup") {
    cleanupMockCustomers()
      .then(() => {
        console.log("✨ Cleanup completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Cleanup failed:", error);
        process.exit(1);
      });
  } else {
    createMockCustomers()
      .then(() => {
        console.log("✨ Mock customer creation completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Mock customer creation failed:", error);
        process.exit(1);
      });
  }
}

export { createMockCustomers, cleanupMockCustomers, mockCustomers };
