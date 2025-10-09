ALTER TABLE "Location" ADD COLUMN "placeId" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "latitude" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "longitude" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "streetNumber" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "route" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "countryCode" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "postalCode" text;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "placeTypes" text[];