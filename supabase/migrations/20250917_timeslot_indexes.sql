-- Enable btree_gist for combining scalar + range in GiST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Booking: ensure generated tstzrange column for overlaps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'Booking' AND column_name = 'timeRange'
  ) THEN
    ALTER TABLE "Booking"
      ADD COLUMN "timeRange" tstzrange
      GENERATED ALWAYS AS (tstzrange("startTime", "endTime", '[)')) STORED;
  END IF;
END $$;

-- Ensure valid booking time window
ALTER TABLE "Booking"
  ADD CONSTRAINT IF NOT EXISTS booking_valid_range CHECK ("startTime" < "endTime");

-- Booking indexes
CREATE INDEX IF NOT EXISTS booking_location_timerange_gist
  ON "Booking" USING GIST ("locationId", "timeRange");

CREATE INDEX IF NOT EXISTS booking_location_localstartdate_idx
  ON "Booking" ("locationId", "localStartDate");

-- Staff unavailability and overrides range indexes
CREATE INDEX IF NOT EXISTS staff_unavailability_staff_daterange_gist
  ON "StaffUnavailability" USING GIST ("staffId", "dateRange");

CREATE INDEX IF NOT EXISTS staff_override_staff_daterange_gist
  ON "StaffScheduleOverride" USING GIST ("staffId", "dateRange");

-- Location closures
CREATE INDEX IF NOT EXISTS location_closure_location_daterange_gist
  ON "LocationClosure" USING GIST ("locationId", "dateRange");

CREATE INDEX IF NOT EXISTS location_closure_location_idx
  ON "LocationClosure" ("locationId");

-- Capabilities and assignments helper indexes
CREATE INDEX IF NOT EXISTS staff_service_capability_service_staff_idx
  ON "StaffServiceCapability" ("serviceId", "staffId");

CREATE INDEX IF NOT EXISTS bsa_employee_start_idx
  ON "BookingServiceAssignment" ("employeeId", "startTime"); 

-- Prevent overlapping service assignments per staff using generated range
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'BookingServiceAssignment' AND column_name = 'timeRange'
  ) THEN
    ALTER TABLE "BookingServiceAssignment"
      ADD COLUMN "timeRange" tstzrange
      GENERATED ALWAYS AS (tstzrange("startTime", "endTime", '[)')) STORED;
  END IF;
END $$;

ALTER TABLE "BookingServiceAssignment"
  ADD CONSTRAINT IF NOT EXISTS bsa_valid_range CHECK ("startTime" < "endTime");

-- Exclusion constraint to disallow overlaps for the same employee
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bsa_employee_no_overlap'
  ) THEN
    ALTER TABLE "BookingServiceAssignment"
      ADD CONSTRAINT bsa_employee_no_overlap
      EXCLUDE USING GIST ("employeeId" WITH =, "timeRange" WITH &&);
  END IF;
END $$;

-- Exclusion constraint to prevent overlapping closures per location
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'location_closure_no_overlap'
  ) THEN
    ALTER TABLE "LocationClosure"
      ADD CONSTRAINT location_closure_no_overlap
      EXCLUDE USING GIST ("locationId" WITH =, "dateRange" WITH &&);
  END IF;
END $$; 