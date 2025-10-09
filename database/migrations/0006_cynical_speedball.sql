CREATE TABLE "StaffServiceCapability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staffId" uuid NOT NULL,
	"serviceId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "StaffServiceCapability" ADD CONSTRAINT "StaffServiceCapability_staffId_User_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffServiceCapability" ADD CONSTRAINT "StaffServiceCapability_serviceId_LocationService_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."LocationService"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_service_capability_unique" ON "StaffServiceCapability" USING btree ("staffId","serviceId");