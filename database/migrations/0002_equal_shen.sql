CREATE TABLE "LocationService" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"categoryId" uuid,
	"serviceTypeId" uuid,
	"name" text NOT NULL,
	"description" text,
	"durationMinutes" integer NOT NULL,
	"priceAmount" integer NOT NULL,
	"priceCurrency" text NOT NULL,
	"displayOrder" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LocationServiceCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"displayOrder" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" DROP CONSTRAINT "BookingServiceAssignment_serviceId_Service_id_fk";
--> statement-breakpoint
ALTER TABLE "Service" DROP CONSTRAINT "Service_locationId_Location_id_fk";
--> statement-breakpoint
ALTER TABLE "Service" DROP CONSTRAINT "Service_categoryId_ServiceCategory_id_fk";
--> statement-breakpoint
ALTER TABLE "ServiceCategory" DROP CONSTRAINT "ServiceCategory_locationId_Location_id_fk";
--> statement-breakpoint
ALTER TABLE "Service" ALTER COLUMN "categoryId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "LocationService" ADD CONSTRAINT "LocationService_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LocationService" ADD CONSTRAINT "LocationService_categoryId_LocationServiceCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."LocationServiceCategory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LocationService" ADD CONSTRAINT "LocationService_serviceTypeId_Service_id_fk" FOREIGN KEY ("serviceTypeId") REFERENCES "public"."Service"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LocationServiceCategory" ADD CONSTRAINT "LocationServiceCategory_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD CONSTRAINT "BookingServiceAssignment_serviceId_LocationService_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."LocationService"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_ServiceCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."ServiceCategory"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Service" DROP COLUMN "locationId";--> statement-breakpoint
ALTER TABLE "Service" DROP COLUMN "durationMinutes";--> statement-breakpoint
ALTER TABLE "Service" DROP COLUMN "priceAmount";--> statement-breakpoint
ALTER TABLE "Service" DROP COLUMN "priceCurrency";--> statement-breakpoint
ALTER TABLE "ServiceCategory" DROP COLUMN "locationId";