ALTER TABLE "Booking" ALTER COLUMN "localStartDate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "localEndDate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "localStartMinutes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "localEndMinutes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD COLUMN "localStartDate" date NOT NULL;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD COLUMN "localStartMinutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD COLUMN "localEndMinutes" integer NOT NULL;