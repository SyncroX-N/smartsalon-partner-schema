CREATE TABLE "LocationCustomer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"customerId" uuid NOT NULL,
	"notes" text,
	"tags" text[],
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ServiceCategory" (
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
ALTER TABLE "CompanyCustomer" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "CompanyCustomer" CASCADE;--> statement-breakpoint
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_companyId_Company_id_fk";
--> statement-breakpoint
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_locationId_Location_id_fk";
--> statement-breakpoint
ALTER TABLE "Service" DROP CONSTRAINT "Service_companyId_Company_id_fk";
--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "locationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Service" ADD COLUMN "locationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "Service" ADD COLUMN "categoryId" uuid;--> statement-breakpoint
ALTER TABLE "Service" ADD COLUMN "displayOrder" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "LocationCustomer" ADD CONSTRAINT "LocationCustomer_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LocationCustomer" ADD CONSTRAINT "LocationCustomer_customerId_User_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "location_customer_unique" ON "LocationCustomer" USING btree ("locationId","customerId");--> statement-breakpoint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Service" ADD CONSTRAINT "Service_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_ServiceCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."ServiceCategory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Booking" DROP COLUMN "companyId";--> statement-breakpoint
ALTER TABLE "Service" DROP COLUMN "companyId";