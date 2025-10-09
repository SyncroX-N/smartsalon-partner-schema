CREATE TYPE "public"."StaffUnavailabilityType" AS ENUM('VACATION', 'SICK_LEAVE', 'APPOINTMENT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."TimeSlotStrategy" AS ENUM('REGULAR', 'REDUCE_GAPS', 'ELIMINATE_GAPS');--> statement-breakpoint
CREATE TABLE "LocationClosure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"dateRange" daterange NOT NULL,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StaffScheduleOverride" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staffId" uuid NOT NULL,
	"locationId" uuid,
	"title" text NOT NULL,
	"description" text,
	"dateRange" daterange NOT NULL,
	"operatingHours" json NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StaffUnavailability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staffId" uuid NOT NULL,
	"locationId" uuid,
	"type" "StaffUnavailabilityType" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"dateRange" daterange NOT NULL,
	"startTime" text,
	"endTime" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Booking" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Company" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Company" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Company" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Company" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Location" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Location" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Location" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Location" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LocationCustomer" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "LocationCustomer" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LocationCustomer" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "LocationCustomer" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LocationService" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "LocationService" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LocationService" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "LocationService" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LocationServiceCategory" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "LocationServiceCategory" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LocationServiceCategory" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "LocationServiceCategory" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Service" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Service" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Service" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Service" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ServiceCategory" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ServiceCategory" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ServiceCategory" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ServiceCategory" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "StaffServiceCapability" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "StaffServiceCapability" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "StaffServiceCapability" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "StaffServiceCapability" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "dateOfBirth" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Booking" ADD COLUMN "timeRange" "tstzrange";--> statement-breakpoint
ALTER TABLE "Booking" ADD COLUMN "localStartDate" date;--> statement-breakpoint
ALTER TABLE "Booking" ADD COLUMN "localEndDate" date;--> statement-breakpoint
ALTER TABLE "Booking" ADD COLUMN "localStartMinutes" integer;--> statement-breakpoint
ALTER TABLE "Booking" ADD COLUMN "localEndMinutes" integer;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "slotDurationMinutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "timeSlotStrategy" "TimeSlotStrategy" DEFAULT 'REGULAR' NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "customerBookingLeadMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "customerBookingMaxMonthsAhead" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "customerCancelLeadMinutes" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "allowCustomerSelectTeamMember" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "showTeamMemberRating" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "notifyTeamOnCustomerActions" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Location" ADD COLUMN "notifyCustomerActionEmails" text;--> statement-breakpoint
ALTER TABLE "LocationClosure" ADD CONSTRAINT "LocationClosure_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffScheduleOverride" ADD CONSTRAINT "StaffScheduleOverride_staffId_User_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffScheduleOverride" ADD CONSTRAINT "StaffScheduleOverride_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffUnavailability" ADD CONSTRAINT "StaffUnavailability_staffId_User_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffUnavailability" ADD CONSTRAINT "StaffUnavailability_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "scheduleOverrides";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "unavailabilities";