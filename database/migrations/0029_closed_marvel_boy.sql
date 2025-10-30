CREATE TYPE "public"."StripeCapabilityStatus" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TYPE "public"."StripeOnboardingStatus" AS ENUM('NOT_CREATED', 'REQUIRES_ACTION', 'PENDING_VERIFICATION', 'ACTIVE', 'RESTRICTED');--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "stripeDetailsSubmitted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "stripeOnboardingStatus" "StripeOnboardingStatus";--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "stripeRequirementsDue" jsonb;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "stripeCardPaymentsCapability" "StripeCapabilityStatus";--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "stripeTransfersCapability" "StripeCapabilityStatus";