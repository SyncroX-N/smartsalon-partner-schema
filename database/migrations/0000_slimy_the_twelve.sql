CREATE TYPE "public"."BookingStatus" AS ENUM('PENDING_CONFIRMATION', 'AWAITING_PAYMENT', 'CONFIRMED_PAID', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_COMPANY', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."CompanyServicesLocation" AS ENUM('PHYSICAL_LOCATION', 'AT_CLIENT_LOCATION', 'DIGITAL');--> statement-breakpoint
CREATE TYPE "public"."CompanySize" AS ENUM('2_5', '6_10', '+11');--> statement-breakpoint
CREATE TYPE "public"."CompanySpecialisation" AS ENUM('HAIR_SALON', 'NAILS', 'EYEBROWS_AND_LASHES', 'BEAUTY_SALON', 'MEDICAL_SPA', 'BARBER', 'MASSAGE', 'SPA_AND_SAUNA', 'WAXING_SALON', 'TATTOO_AND_PIERCING', 'TANNING_STUDIO', 'FITNESS_AND_WELLNESS', 'PHYSICAL_THERAPY', 'HEALTH_PRACTICE', 'PET_GROOMING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."CompanyType" AS ENUM('BUSINESS', 'INDIVIDUAL');--> statement-breakpoint
CREATE TYPE "public"."UserType" AS ENUM('COMPANY_ADMIN', 'COMPANY_EMPLOYEE', 'CUSTOMER');--> statement-breakpoint
CREATE TABLE "Booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customerId" uuid,
	"guestFirstName" text,
	"guestLastName" text,
	"guestPhoneNumber" text,
	"companyId" uuid NOT NULL,
	"locationId" uuid,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone NOT NULL,
	"totalAmount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" "BookingStatus" DEFAULT 'AWAITING_PAYMENT' NOT NULL,
	"paymentIntentId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BookingServiceAssignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingId" uuid NOT NULL,
	"serviceId" uuid NOT NULL,
	"employeeId" uuid NOT NULL,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone NOT NULL,
	"priceAtBookingAmount" integer NOT NULL,
	"priceAtBookingCurrency" text NOT NULL,
	"durationAtBookingMinutes" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "CompanyType",
	"mainSpecialisation" "CompanySpecialisation",
	"secondarySpecialisations" "CompanySpecialisation"[],
	"size" "CompanySize",
	"servicesLocation" "CompanyServicesLocation",
	"businessName" text,
	"country" text,
	"timezone" text,
	"currency" text,
	"address" text,
	"phoneNumber" text,
	"email" text,
	"website" text,
	"description" text,
	"logoUrl" text,
	"bannerUrl" text,
	"legalName" text,
	"registrationNumber" text,
	"vatNumber" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompanyCustomer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"customerId" uuid NOT NULL,
	"notes" text,
	"tags" text[],
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripeAccountId" text,
	"stripeDashboardUrl" text,
	"payoutsEnabled" boolean DEFAULT false,
	"name" text,
	"address" text,
	"phoneNumber" text,
	"email" text,
	"companyId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"durationMinutes" integer NOT NULL,
	"priceAmount" integer NOT NULL,
	"priceCurrency" text NOT NULL,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" "UserType",
	"companyId" uuid,
	"locationId" uuid,
	"phoneNumber" text,
	"email" text,
	"firstName" text,
	"lastName" text,
	"preferredLanguage" text
);
--> statement-breakpoint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_User_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD CONSTRAINT "BookingServiceAssignment_bookingId_Booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD CONSTRAINT "BookingServiceAssignment_serviceId_Service_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "BookingServiceAssignment" ADD CONSTRAINT "BookingServiceAssignment_employeeId_User_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CompanyCustomer" ADD CONSTRAINT "CompanyCustomer_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CompanyCustomer" ADD CONSTRAINT "CompanyCustomer_customerId_User_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Service" ADD CONSTRAINT "Service_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_Location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "company_customer_unique" ON "CompanyCustomer" USING btree ("companyId","customerId");