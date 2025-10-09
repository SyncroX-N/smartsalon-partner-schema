-- Prevent overlapping bookings at the location level
-- This ensures no two bookings can overlap in time for the same location

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_location_no_overlap'
  ) THEN
    ALTER TABLE "Booking"
      ADD CONSTRAINT booking_location_no_overlap
      EXCLUDE USING GIST ("locationId" WITH =, "timeRange" WITH &&);
  END IF;
END $$;

-- Add index for faster conflict detection queries
CREATE INDEX IF NOT EXISTS booking_location_timerange_conflict_idx
  ON "Booking" USING GIST ("locationId", "timeRange")
  WHERE "status" NOT IN ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_COMPANY', 'NO_SHOW');

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT booking_location_no_overlap ON "Booking" IS 
'Prevents overlapping bookings at the same location. Two bookings cannot have overlapping time ranges for the same location.';
