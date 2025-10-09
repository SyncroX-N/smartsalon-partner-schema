ALTER TABLE "StaffScheduleOverride" ALTER COLUMN "operatingHours" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "operatingHours" DROP NOT NULL;