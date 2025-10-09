import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------- Schema ----------
const createBookingSchema = z.object({
  locationId: z.string().uuid(),
  customerId: z.string().uuid(),
  services: z
    .array(
      z.object({
        id: z.string().uuid(),
        priceAmount: z.coerce.number().int().nonnegative(),
        priceCurrency: z.string().min(3),
        durationMinutes: z.coerce.number().int().positive(),
        staff: z.object({ id: z.string().uuid() }),
      })
    )
    .min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // local YYYY-MM-DD (location tz)
  slot: z.object({
    startLocal: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (local)
    endLocal: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (local)
    timeZone: z.string(), // IANA tz (from client; we’ll still fetch location.tz)
    assignments: z.array(
      z.object({
        serviceId: z.string().uuid(),
        staffId: z.string().uuid(),
        startLocal: z.string().regex(/^\d{2}:\d{2}$/),
        endLocal: z.string().regex(/^\d{2}:\d{2}$/),
      })
    ),
  }),
  notes: z.string().optional(),
});

type CreateBookingPayload = z.infer<typeof createBookingSchema>;

// ---------- Time helpers ----------
function parseHHMM(hhmm: string): { h: number; m: number; minutes: number } {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const minutes = h * 60 + m;
  return { h, m, minutes };
}

function addDaysISO(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`); // treat as UTC midnight safely
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// Convert a local date+time (in a given IANA tz) into UTC ISO
function localToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string
): string {
  // Build a Date object that represents the local time in the target timezone,
  // by adjusting offset difference between target tz and UTC.
  const localDateTime = new Date(`${dateStr}T${timeStr}:00`);
  const utcTime = new Date(
    localDateTime.toLocaleString("en-US", { timeZone: "UTC" })
  );
  const localTime = new Date(
    localDateTime.toLocaleString("en-US", { timeZone: timezone })
  );
  const offset = localTime.getTime() - utcTime.getTime();
  const utcDateTime = new Date(localDateTime.getTime() - offset);
  return utcDateTime.toISOString();
}

// Given local date + start/end HH:MM (same local day), compute:
// - UTC start/end
// - localStartDate/localEndDate (with day rollover)
// - localStartMinutes/localEndMinutes
function computeSpanForLocalDay(
  dateStr: string,
  startHHMM: string,
  endHHMM: string,
  tz: string
) {
  const s = parseHHMM(startHHMM);
  const e = parseHHMM(endHHMM);

  // If end < start, we rolled into the next local day.
  const rolled = e.minutes < s.minutes;
  const endDateLocal = rolled ? addDaysISO(dateStr, 1) : dateStr;

  const startTimeUtc = localToUtc(dateStr, startHHMM, tz);
  const endTimeUtc = localToUtc(endDateLocal, endHHMM, tz);

  return {
    // UTC
    startTimeUtc,
    endTimeUtc,
    // Local helpers
    localStartDate: dateStr,
    localEndDate: endDateLocal,
    localStartMinutes: s.minutes,
    localEndMinutes: e.minutes + (rolled ? 24 * 60 : 0), // keep as absolute minutes across midnight for easy comparisons
  };
}

// ---------- Money helpers ----------
function computeTotalAmount(services: { priceAmount: number }[]) {
  const total = services.reduce((sum, s) => sum + s.priceAmount, 0);
  if (!Number.isFinite(total) || total < 0)
    throw new Error("Invalid total amount");
  return total;
}

function ensureSingleCurrency(services: { priceCurrency: string }[]) {
  const set = new Set(services.map((s) => s.priceCurrency));
  if (set.size !== 1) throw new Error("MULTI_CURRENCY_NOT_SUPPORTED");
  return services[0].priceCurrency;
}

// ---------- Conflict helpers (no dependency on timeRange) ----------
function overlapsUTC(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  const A = new Date(aStart).getTime();
  const B = new Date(aEnd).getTime();
  const C = new Date(bStart).getTime();
  const D = new Date(bEnd).getTime();
  return A < D && B > C;
}

// Booking-level conflict (by location)
async function hasBookingConflict(
  supabase: any,
  locationId: string,
  startUtc: string,
  endUtc: string
) {
  const { data, error } = await supabase
    .from("Booking")
    .select("id,startTime,endTime,status")
    .eq("locationId", locationId)
    .not("status", "in", [
      "CANCELLED_BY_CUSTOMER",
      "CANCELLED_BY_COMPANY",
      "NO_SHOW",
    ])
    .lte("startTime", endUtc)
    .gte("endTime", startUtc)
    .limit(50);

  if (error) {
    console.error("Booking conflict query error:", error);
    return false; // fail open to avoid hard-blocking
  }
  return (data ?? []).some((b: any) =>
    overlapsUTC(b.startTime, b.endTime, startUtc, endUtc)
  );
}

// Staff-level conflict (per assignment)
async function hasAnyStaffConflict(
  supabase: any,
  assignments: { employeeId: string; startTime: string; endTime: string }[]
) {
  for (const a of assignments) {
    const { data, error } = await supabase
      .from("BookingServiceAssignment")
      .select("id,startTime,endTime,employeeId")
      .eq("employeeId", a.employeeId)
      .lte("startTime", a.endTime)
      .gte("endTime", a.startTime)
      .limit(50);

    if (error) {
      console.error("Staff conflict query error:", error);
      continue;
    }
    const conflict = (data ?? []).some((r: any) =>
      overlapsUTC(r.startTime, r.endTime, a.startTime, a.endTime)
    );
    if (conflict) return true;
  }
  return false;
}

// ---------- Handler ----------
serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload
    const body = await req.json();
    const payload: CreateBookingPayload = createBookingSchema.parse(body);

    // Fetch location tz (source of truth)
    const { data: location, error: locErr } = await supabase
      .from("Location")
      .select("timezone")
      .eq("id", payload.locationId)
      .single();

    if (locErr || !location) {
      return new Response(JSON.stringify({ error: "Location not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const tz = location.timezone as string;

    // ----- Compute booking span (UTC + local helpers) -----
    const bookingSpan = computeSpanForLocalDay(
      payload.date,
      payload.slot.startLocal,
      payload.slot.endLocal,
      tz
    );

    const totalAmount = computeTotalAmount(payload.services);
    const currency = ensureSingleCurrency(payload.services);

    // ----- Build assignment rows (with UTC + local helpers) -----
    const assignments = payload.slot.assignments.map((a) => {
      const svc = payload.services.find((s) => s.id === a.serviceId);
      if (!svc)
        throw new Error(`Service ${a.serviceId} not found in services list`);

      const span = computeSpanForLocalDay(
        payload.date,
        a.startLocal,
        a.endLocal,
        tz
      );

      return {
        serviceId: a.serviceId,
        employeeId: a.staffId,
        // UTC
        startTime: span.startTimeUtc,
        endTime: span.endTimeUtc,
        // local helpers (stored on BSA)
        localStartDate: span.localStartDate,
        localStartMinutes: span.localStartMinutes,
        localEndMinutes: span.localEndMinutes,
        // snapshots
        priceAtBookingAmount: svc.priceAmount,
        priceAtBookingCurrency: svc.priceCurrency,
        durationAtBookingMinutes: svc.durationMinutes,
      };
    });

    // ----- Conflicts (pre-checks) -----
    const bookingConflict = await hasBookingConflict(
      supabase,
      payload.locationId,
      bookingSpan.startTimeUtc,
      bookingSpan.endTimeUtc
    );
    if (bookingConflict) {
      return new Response(
        JSON.stringify({
          error: "Time slot is no longer available",
          code: "SLOT_CONFLICT",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const staffConflict = await hasAnyStaffConflict(
      supabase,
      assignments.map((a) => ({
        employeeId: a.employeeId,
        startTime: a.startTime,
        endTime: a.endTime,
      }))
    );
    if (staffConflict) {
      return new Response(
        JSON.stringify({
          error: "Staff member is no longer available",
          code: "STAFF_CONFLICT",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // ----- Create booking (with local helpers) -----
    const { data: booking, error: bookingError } = await supabase
      .from("Booking")
      .insert({
        customerId: payload.customerId,
        locationId: payload.locationId,
        // UTC
        startTime: bookingSpan.startTimeUtc,
        endTime: bookingSpan.endTimeUtc,
        // local helpers
        localStartDate: bookingSpan.localStartDate,
        localEndDate: bookingSpan.localEndDate,
        localStartMinutes: bookingSpan.localStartMinutes,
        localEndMinutes: bookingSpan.localEndMinutes,
        // money
        totalAmount,
        currency,
        status: "AWAITING_PAYMENT",
        notes: payload.notes ?? null,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      return new Response(
        JSON.stringify({
          error: "Failed to create booking",
          details: bookingError,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ----- Create assignments (attach bookingId) -----
    const rows = assignments.map((a) => ({ ...a, bookingId: booking.id }));
    const { error: assignmentsError } = await supabase
      .from("BookingServiceAssignment")
      .insert(rows);

    if (assignmentsError) {
      console.error("Service assignments error:", assignmentsError);
      // best-effort rollback
      await supabase.from("Booking").delete().eq("id", booking.id);
      // map constraint violations to 409
      const code = (assignmentsError as any).code;
      if (code === "23P01" || code === "23514") {
        return new Response(
          JSON.stringify({
            error: "STAFF_CONFLICT",
            details: assignmentsError,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          error: "Failed to create service assignments",
          details: assignmentsError,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ----- Success -----
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bookingId: booking.id,
          status: booking.status,
          // return both UTC + local helpers for client convenience
          startTime: bookingSpan.startTimeUtc,
          endTime: bookingSpan.endTimeUtc,
          local: {
            startDate: bookingSpan.localStartDate,
            endDate: bookingSpan.localEndDate,
            startMinutes: bookingSpan.localStartMinutes,
            endMinutes: bookingSpan.localEndMinutes,
          },
          totalAmount,
          currency,
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Create booking error:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
