ALTER TABLE "StaffScheduleOverride" ALTER COLUMN "operatingHours" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "StaffScheduleOverride" ALTER COLUMN "operatingHours" SET DEFAULT '{"mon":[],"tue":[],"wed":[],"thu":[],"fri":[],"sat":[],"sun":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "operatingHours" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "operatingHours" SET DEFAULT '{"mon":["09:00:00","20:00:00"],"tue":["09:00:00","20:00:00"],"wed":["09:00:00","20:00:00"],"thu":["09:00:00","20:00:00"],"fri":["09:00:00","20:00:00"],"sat":["09:00:00","20:00:00"],"sun":["09:00:00","20:00:00"]}'::jsonb;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "operatingHours" SET NOT NULL;