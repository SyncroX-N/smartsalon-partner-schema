import { db } from "../db/index";
import {
  locationServiceCategory,
  locationService,
  service,
} from "../db/schema";
import { sql } from "drizzle-orm";

// Sample location ID - replace with actual ID from your database
const LOCATION_ID = "85d3be30-dd4a-4d18-b2c9-d0019db15b92";

// Example location-specific services for a hair salon
const sampleLocationServices = {
  categories: [
    {
      name: "Haircuts & Styling",
      description: "Professional haircuts and styling services",
      displayOrder: 1,
      services: [
        {
          name: "Women's Haircut",
          description: "Professional haircut and styling for women",
          durationMinutes: 60,
          priceAmount: 8500, // $85.00 in cents
          serviceTypeName: "Haircuts", // Links to general service
          displayOrder: 1,
        },
        {
          name: "Men's Haircut",
          description: "Classic and modern haircuts for men",
          durationMinutes: 45,
          priceAmount: 5500, // $55.00 in cents
          serviceTypeName: "Men's Haircuts",
          displayOrder: 2,
        },
        {
          name: "Children's Haircut",
          description: "Gentle haircuts for children under 12",
          durationMinutes: 30,
          priceAmount: 3500, // $35.00 in cents
          serviceTypeName: "Haircuts",
          displayOrder: 3,
        },
        {
          name: "Blow Dry & Style",
          description: "Professional blow dry and styling",
          durationMinutes: 30,
          priceAmount: 4500, // $45.00 in cents
          serviceTypeName: "Hair Styling",
          displayOrder: 4,
        },
      ],
    },
    {
      name: "Hair Coloring",
      description: "Professional hair coloring and highlights",
      displayOrder: 2,
      services: [
        {
          name: "Full Head Color",
          description: "Complete hair color transformation",
          durationMinutes: 120,
          priceAmount: 15000, // $150.00 in cents
          serviceTypeName: "Hair Coloring",
          displayOrder: 1,
        },
        {
          name: "Highlights",
          description: "Professional hair highlighting",
          durationMinutes: 90,
          priceAmount: 12000, // $120.00 in cents
          serviceTypeName: "Hair Coloring",
          displayOrder: 2,
        },
        {
          name: "Root Touch Up",
          description: "Color touch up for roots",
          durationMinutes: 60,
          priceAmount: 8000, // $80.00 in cents
          serviceTypeName: "Hair Coloring",
          displayOrder: 3,
        },
      ],
    },
    {
      name: "Hair Treatments",
      description: "Specialized hair care treatments",
      displayOrder: 3,
      services: [
        {
          name: "Deep Conditioning Treatment",
          description: "Intensive hair moisturizing treatment",
          durationMinutes: 45,
          priceAmount: 6500, // $65.00 in cents
          serviceTypeName: "Hair Treatments",
          displayOrder: 1,
        },
        {
          name: "Keratin Treatment",
          description: "Professional keratin smoothing treatment",
          durationMinutes: 180,
          priceAmount: 25000, // $250.00 in cents
          serviceTypeName: "Hair Treatments",
          displayOrder: 2,
        },
      ],
    },
  ],
};

async function createLocationServices() {
  try {
    console.log("🏪 Creating location-specific services...");

    // First, get all available general services for reference
    const generalServices = await db.query.service.findMany();
    console.log(
      `📋 Found ${generalServices.length} general services available`
    );

    if (generalServices.length === 0) {
      console.log(
        "⚠️  No general services found. Please run 'npm run db:create-macro-services' first."
      );
      return;
    }

    let totalCategories = 0;
    let totalServices = 0;

    for (const categoryData of sampleLocationServices.categories) {
      // Create location service category
      const [createdCategory] = await db
        .insert(locationServiceCategory)
        .values({
          locationId: LOCATION_ID,
          name: categoryData.name,
          description: categoryData.description,
          displayOrder: categoryData.displayOrder,
          isActive: true,
        })
        .returning({ id: locationServiceCategory.id })
        .onConflictDoNothing();

      if (createdCategory) {
        console.log(`  ✅ Created category: ${categoryData.name}`);
        totalCategories++;

        // Create services for this category
        for (const serviceData of categoryData.services) {
          // Find the general service ID by name
          const generalService = generalServices.find(
            (service) => service.name === serviceData.serviceTypeName
          );

          if (!generalService) {
            console.log(
              `    ⚠️  General service "${serviceData.serviceTypeName}" not found, creating service without general service link`
            );
          }

          await db
            .insert(locationService)
            .values({
              locationId: LOCATION_ID,
              categoryId: createdCategory.id,
              serviceTypeId: generalService?.id || null,
              name: serviceData.name,
              description: serviceData.description,
              durationMinutes: serviceData.durationMinutes,
              priceAmount: serviceData.priceAmount,
              priceCurrency: "USD",
              displayOrder: serviceData.displayOrder,
              isActive: true,
            })
            .onConflictDoNothing();

          const serviceTypeInfo = generalService
            ? ` (linked to: ${generalService.name})`
            : " (no general service link)";
          console.log(
            `    ✅ Created service: ${serviceData.name} ($${(
              serviceData.priceAmount / 100
            ).toFixed(2)})${serviceTypeInfo}`
          );
          totalServices++;
        }
      } else {
        console.log(
          `  ⚠️  Category "${categoryData.name}" already exists for this location, skipping...`
        );
      }
    }

    console.log(`\n🎉 Successfully created:`);
    console.log(`   📋 ${totalCategories} location service categories`);
    console.log(`   🛍️  ${totalServices} location services`);
    console.log(`\n💡 You can now:`);
    console.log(`   - View categories and services in your admin panel`);
    console.log(`   - Customize prices and durations as needed`);
    console.log(`   - Add more services to existing categories`);
    console.log(`   - Create bookings with these services`);
    console.log(`   - Filter locations by general service types`);
  } catch (error) {
    console.error("❌ Error creating location services:", error);
    throw error;
  }
}

async function cleanupLocationServices() {
  try {
    console.log("🧹 Cleaning up location services...");

    // Delete all location services for this location
    await db.execute(sql`
      DELETE FROM "LocationService" 
      WHERE "locationId" = ${LOCATION_ID}
    `);

    // Delete all location service categories for this location
    await db.execute(sql`
      DELETE FROM "LocationServiceCategory" 
      WHERE "locationId" = ${LOCATION_ID}
    `);

    console.log("✅ Location services and categories cleaned up successfully!");
  } catch (error) {
    console.error("❌ Error cleaning up location services:", error);
    throw error;
  }
}

// Helper function to list available general services
async function listAvailableGeneralServices() {
  try {
    console.log("📋 Available general services for reference:");

    const categoriesWithServices = await db.query.serviceCategory.findMany({
      with: {
        services: {
          orderBy: (services, { asc }) => [asc(services.displayOrder)],
        },
      },
      orderBy: (categories, { asc }) => [asc(categories.displayOrder)],
    });

    if (categoriesWithServices.length === 0) {
      console.log(
        "⚠️  No general service structure found. Run 'npm run db:create-macro-services' first."
      );
      return;
    }

    categoriesWithServices.forEach((category) => {
      console.log(`\n📂 ${category.name}`);
      category.services.forEach((service) => {
        console.log(`   🔹 ${service.name} (ID: ${service.id})`);
      });
    });
  } catch (error) {
    console.error("❌ Error listing general services:", error);
    throw error;
  }
}

// Run based on command line arguments
if (require.main === module) {
  const action = process.argv[2];

  if (action === "cleanup") {
    cleanupLocationServices()
      .then(() => {
        console.log("✨ Cleanup completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Cleanup failed:", error);
        process.exit(1);
      });
  } else if (action === "list-general-services") {
    listAvailableGeneralServices()
      .then(() => {
        console.log("✨ Listing completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Listing failed:", error);
        process.exit(1);
      });
  } else {
    createLocationServices()
      .then(() => {
        console.log("✨ Location service creation completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Location service creation failed:", error);
        process.exit(1);
      });
  }
}

export {
  createLocationServices,
  cleanupLocationServices,
  listAvailableGeneralServices,
  sampleLocationServices,
};
