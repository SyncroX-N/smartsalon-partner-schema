CREATE TYPE "public"."LocationRole" AS ENUM('ADMIN', 'MANAGER', 'STAFF', 'VIEW_ONLY');--> statement-breakpoint
CREATE TABLE "UserLocationAccess" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"role" "LocationRole" DEFAULT 'STAFF' NOT NULL,
	"permissions" json,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "UserLocationAccess" ADD CONSTRAINT "UserLocationAccess_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserLocationAccess" ADD CONSTRAINT "UserLocationAccess_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_location_access_unique" ON "UserLocationAccess" USING btree ("userId","locationId");--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "permissions";