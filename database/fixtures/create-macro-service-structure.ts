import { db } from "../db/index";
import { serviceCategory, service } from "../db/schema";
import { sql } from "drizzle-orm";

// Global service structure that all locations can reference
const macroServiceStructure = {
  categories: [
    {
      name: "Hair Services",
      description: "Hair cutting, styling, and treatment services",
      displayOrder: 1,
      serviceTypes: [
        {
          name: "Haircuts",
          description: "All types of hair cutting services",
          displayOrder: 1,
        },
        {
          name: "Hair Coloring",
          description: "Hair dyeing, highlighting, and color treatments",
          displayOrder: 2,
        },
        {
          name: "Hair Treatments",
          description: "Conditioning, keratin, and specialized hair treatments",
          displayOrder: 3,
        },
        {
          name: "Hair Styling",
          description: "Blow drying, styling, and special occasion hair",
          displayOrder: 4,
        },
      ],
    },
    {
      name: "Nail Services",
      description: "Manicure, pedicure, and nail art services",
      displayOrder: 2,
      serviceTypes: [
        {
          name: "Manicures",
          description: "Hand and nail care services",
          displayOrder: 1,
        },
        {
          name: "Pedicures",
          description: "Foot and toenail care services",
          displayOrder: 2,
        },
        {
          name: "Nail Art",
          description: "Decorative nail designs and specialty treatments",
          displayOrder: 3,
        },
        {
          name: "Nail Extensions",
          description: "Artificial nail extensions and enhancements",
          displayOrder: 4,
        },
      ],
    },
    {
      name: "Facial & Skincare",
      description: "Facial treatments and skincare services",
      displayOrder: 3,
      serviceTypes: [
        {
          name: "Basic Facials",
          description: "Standard cleansing and moisturizing facials",
          displayOrder: 1,
        },
        {
          name: "Anti-Aging Treatments",
          description: "Specialized anti-aging and wrinkle treatments",
          displayOrder: 2,
        },
        {
          name: "Acne Treatments",
          description: "Treatments for acne-prone skin",
          displayOrder: 3,
        },
        {
          name: "Specialty Facials",
          description: "Hydrating, brightening, and other specialty facials",
          displayOrder: 4,
        },
      ],
    },
    {
      name: "Body Treatments",
      description: "Massage and body care services",
      displayOrder: 4,
      serviceTypes: [
        {
          name: "Relaxation Massage",
          description: "Swedish and relaxation massage therapies",
          displayOrder: 1,
        },
        {
          name: "Therapeutic Massage",
          description: "Deep tissue and therapeutic massage",
          displayOrder: 2,
        },
        {
          name: "Specialty Massage",
          description: "Hot stone, aromatherapy, and specialty massages",
          displayOrder: 3,
        },
        {
          name: "Body Treatments",
          description: "Body wraps, scrubs, and skin treatments",
          displayOrder: 4,
        },
      ],
    },
    {
      name: "Beauty Services",
      description: "Makeup, eyebrow, and beauty enhancement services",
      displayOrder: 5,
      serviceTypes: [
        {
          name: "Makeup Application",
          description: "Professional makeup for events and everyday",
          displayOrder: 1,
        },
        {
          name: "Eyebrow Services",
          description: "Eyebrow shaping, tinting, and treatments",
          displayOrder: 2,
        },
        {
          name: "Eyelash Services",
          description: "Eyelash extensions, lifts, and tinting",
          displayOrder: 3,
        },
        {
          name: "Waxing & Hair Removal",
          description: "Hair removal services for face and body",
          displayOrder: 4,
        },
      ],
    },
    {
      name: "Men's Grooming",
      description: "Specialized men's grooming and barber services",
      displayOrder: 6,
      serviceTypes: [
        {
          name: "Men's Haircuts",
          description: "Traditional and modern men's haircuts",
          displayOrder: 1,
        },
        {
          name: "Beard Services",
          description: "Beard trimming, shaping, and grooming",
          displayOrder: 2,
        },
        {
          name: "Shaving Services",
          description: "Traditional wet shaves and head shaves",
          displayOrder: 3,
        },
        {
          name: "Men's Skincare",
          description: "Facials and skincare treatments for men",
          displayOrder: 4,
        },
      ],
    },
  ],
};

async function createMacroServiceStructure() {
  try {
    console.log("🏗️  Creating global macro service structure...");

    let totalCategories = 0;
    let totalServiceTypes = 0;

    for (const categoryData of macroServiceStructure.categories) {
      // Create service category
      const [createdCategory] = await db
        .insert(serviceCategory)
        .values({
          name: categoryData.name,
          description: categoryData.description,
          displayOrder: categoryData.displayOrder,
          isActive: true,
        })
        .returning({ id: serviceCategory.id })
        .onConflictDoNothing();

      if (createdCategory) {
        console.log(`  ✅ Created category: ${categoryData.name}`);
        totalCategories++;

        // Create services for this category
        for (const serviceTypeData of categoryData.serviceTypes) {
          await db
            .insert(service)
            .values({
              categoryId: createdCategory.id,
              name: serviceTypeData.name,
              description: serviceTypeData.description,
              displayOrder: serviceTypeData.displayOrder,
              isActive: true,
            })
            .onConflictDoNothing();

          console.log(`    ✅ Created service: ${serviceTypeData.name}`);
          totalServiceTypes++;
        }
      } else {
        console.log(
          `  ⚠️  Category "${categoryData.name}" already exists, skipping...`
        );
      }
    }

    console.log(`\n🎉 Successfully created:`);
    console.log(`   📋 ${totalCategories} macro service categories`);
    console.log(`   🛍️  ${totalServiceTypes} macro service types`);
    console.log(`\n💡 You can now:`);
    console.log(
      `   - Reference these service types when creating location services`
    );
    console.log(`   - Filter/search locations by service types`);
    console.log(`   - Maintain consistency across all locations`);
    console.log(
      `   - Create location-specific services that link to these types`
    );
  } catch (error) {
    console.error("❌ Error creating macro service structure:", error);
    throw error;
  }
}

async function cleanupMacroServiceStructure() {
  try {
    console.log("🧹 Cleaning up macro service structure...");

    // Delete all services (will cascade from categories)
    await db.execute(sql`
      DELETE FROM "Service"
    `);

    // Delete all service categories
    await db.execute(sql`
      DELETE FROM "ServiceCategory"
    `);

    console.log("✅ Macro service structure cleaned up successfully!");
  } catch (error) {
    console.error("❌ Error cleaning up macro service structure:", error);
    throw error;
  }
}

// Helper function to get all macro service types for reference
async function listMacroServiceStructure() {
  try {
    console.log("📋 Current macro service structure:");

    const categoriesWithServices = await db.query.serviceCategory.findMany({
      with: {
        services: {
          orderBy: (services, { asc }) => [asc(services.displayOrder)],
        },
      },
      orderBy: (categories, { asc }) => [asc(categories.displayOrder)],
    });

    categoriesWithServices.forEach((category) => {
      console.log(`\n📂 ${category.name}`);
      console.log(`   ${category.description}`);
      category.services.forEach((service) => {
        console.log(`   🔹 ${service.name} (ID: ${service.id})`);
        console.log(`     ${service.description}`);
      });
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Categories: ${categoriesWithServices.length}`);
    console.log(
      `   Services: ${categoriesWithServices.reduce((sum, cat) => sum + cat.services.length, 0)}`
    );
  } catch (error) {
    console.error("❌ Error listing macro service structure:", error);
    throw error;
  }
}

// Run based on command line arguments
if (require.main === module) {
  const action = process.argv[2];

  if (action === "cleanup") {
    cleanupMacroServiceStructure()
      .then(() => {
        console.log("✨ Cleanup completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Cleanup failed:", error);
        process.exit(1);
      });
  } else if (action === "list") {
    listMacroServiceStructure()
      .then(() => {
        console.log("✨ Listing completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Listing failed:", error);
        process.exit(1);
      });
  } else {
    createMacroServiceStructure()
      .then(() => {
        console.log("✨ Macro service structure creation completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Macro service structure creation failed:", error);
        process.exit(1);
      });
  }
}

export {
  createMacroServiceStructure,
  cleanupMacroServiceStructure,
  listMacroServiceStructure,
  macroServiceStructure,
};
