-- Row Level Security (RLS) Policies for Multi-tenant Data Isolation
-- This ensures users can only access data belonging to their company

-- Enable RLS on all tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingServiceAssignment" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Users can read their own record
CREATE POLICY "Users can read own record" ON "User"
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON "User"
  FOR UPDATE USING (auth.uid() = id);

-- Company admins can read users in their company
CREATE POLICY "Company admins can read company users" ON "User"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()
      AND u.type = 'COMPANY_ADMIN'
      AND u."companyId" = "User"."companyId"
    )
  );

-- Company table policies
-- Users can read their own company
CREATE POLICY "Users can read own company" ON "Company"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND "companyId" = "Company".id
    )
  );

-- Only company admins can update company info
CREATE POLICY "Company admins can update company" ON "Company"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND type = 'COMPANY_ADMIN'
      AND "companyId" = "Company".id
    )
  );

-- Location table policies
-- Users can read locations in their company
CREATE POLICY "Users can read company locations" ON "Location"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND "companyId" = "Location"."companyId"
    )
  );

-- Company admins can manage locations
CREATE POLICY "Company admins can manage locations" ON "Location"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND type = 'COMPANY_ADMIN'
      AND "companyId" = "Location"."companyId"
    )
  );

-- Service table policies
-- Users can read services in their company
CREATE POLICY "Users can read company services" ON "Service"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND "companyId" = "Service"."companyId"
    )
  );

-- Company admins can manage services
CREATE POLICY "Company admins can manage services" ON "Service"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND type = 'COMPANY_ADMIN'
      AND "companyId" = "Service"."companyId"
    )
  );

-- Booking table policies
-- Users can read bookings in their company
CREATE POLICY "Users can read company bookings" ON "Booking"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND "companyId" = "Booking"."companyId"
    )
  );

-- Customers can read their own bookings across companies
CREATE POLICY "Customers can read own bookings" ON "Booking"
  FOR SELECT USING (
    auth.uid() = "customerId"
  );

-- Company users can manage bookings for their company
CREATE POLICY "Company users can manage company bookings" ON "Booking"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND "companyId" = "Booking"."companyId"
      AND type IN ('COMPANY_ADMIN', 'COMPANY_EMPLOYEE')
    )
  );

-- Customers can create bookings (insert only)
CREATE POLICY "Customers can create bookings" ON "Booking"
  FOR INSERT WITH CHECK (
    auth.uid() = "customerId" OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND type = 'CUSTOMER'
    )
  );

-- BookingServiceAssignment table policies
-- Users can read assignments for bookings in their company
CREATE POLICY "Users can read company booking assignments" ON "BookingServiceAssignment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Booking" b
      JOIN "User" u ON u.id = auth.uid()
      WHERE b.id = "BookingServiceAssignment"."bookingId"
      AND u."companyId" = b."companyId"
    )
  );

-- Company users can manage booking assignments for their company
CREATE POLICY "Company users can manage booking assignments" ON "BookingServiceAssignment"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Booking" b
      JOIN "User" u ON u.id = auth.uid()
      WHERE b.id = "BookingServiceAssignment"."bookingId"
      AND u."companyId" = b."companyId"
      AND u.type IN ('COMPANY_ADMIN', 'COMPANY_EMPLOYEE')
    )
  );

-- Customers can read their own booking assignments
CREATE POLICY "Customers can read own booking assignments" ON "BookingServiceAssignment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Booking"
      WHERE id = "BookingServiceAssignment"."bookingId"
      AND "customerId" = auth.uid()
    )
  ); 