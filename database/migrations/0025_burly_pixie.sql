ALTER TABLE "Company" ADD COLUMN "stripeAccountId" text;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "payoutsEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "chargesEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "Location" DROP COLUMN "stripeAccountId";--> statement-breakpoint
ALTER TABLE "Location" DROP COLUMN "stripeDashboardUrl";--> statement-breakpoint
ALTER TABLE "Location" DROP COLUMN "payoutsEnabled";--> statement-breakpoint
ALTER TABLE "Company" ADD CONSTRAINT "Company_stripeAccountId_unique" UNIQUE("stripeAccountId");