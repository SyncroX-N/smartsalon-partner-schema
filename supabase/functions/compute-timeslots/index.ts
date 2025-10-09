// supabase/functions/compute-timeslots/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

/** ========== Domain types (Option A) ========== */
type HHMM = `${number}${number}:${number}${number}`;
type DayInterval = { start: HHMM; end: HHMM };
type RegularSchedule = {
  mon: DayInterval[];
  tue: DayInterval[];
  wed: DayInterval[];
  thu: DayInterval[];
  fri: DayInterval[];
  sat: DayInterval[];
  sun: DayInterval[];
};
type TimeSlotStrategy = "REGULAR" | "REDUCE_GAPS" | "ELIMINATE_GAPS";

interface LocationRow {
  id: string;
  timezone: string | null;
  slotDurationMinutes: number;
  customerBookingLeadMinutes: number;
  customerBookingMaxMonthsAhead: number;
  timeSlotStrategy: TimeSlotStrategy;
  allowCustomerSelectTeamMember: boolean;
}
interface UserRow {
  id: string;
  locationId: string;
  operatingHours: RegularSchedule | null;
}
interface LocationClosureRow {
  dateRange: string | null;
}
interface LocationServiceRow {
  id: string;
  locationId: string;
  durationMinutes: number;
  isActive: boolean;
}
interface StaffScheduleOverrideRow {
  id: string;
  staffId: string;
  dateRange: string | null;
  operatingHours: RegularSchedule;
}
interface StaffUnavailabilityRow {
  id: string;
  staffId: string;
  dateRange: string | null;
  startTime: string | null;
  endTime: string | null;
}
interface BookingServiceAssignmentRow {
  employeeId: string;
  startTime: string;
  endTime: string;
}

type Database = {
  public: {
    Tables: {
      Location: { Row: LocationRow };
      User: { Row: UserRow };
      LocationClosure: { Row: LocationClosureRow };
      LocationService: { Row: LocationServiceRow };
      StaffScheduleOverride: { Row: StaffScheduleOverrideRow };
      StaffUnavailability: { Row: StaffUnavailabilityRow };
      BookingServiceAssignment: { Row: BookingServiceAssignmentRow };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** ========== Request/Response ========== */
const payloadSchema = z.object({
  dateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locationId: z.string().uuid(),
  services: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        staffId: z.string().uuid().nullable().optional(),
        order: z.number().int().min(0).optional(),
      })
    )
    .min(1),
});
type ComputeRequest = z.infer<typeof payloadSchema>;

type TimeslotAssignment = {
  serviceId: string;
  staffId: string;
  startLocal: string;
  endLocal: string;
};
type Timeslot = {
  startLocal: string;
  endLocal: string;
  timeZone: string;
  assignments: TimeslotAssignment[];
};
type ComputeResponse = { data: Timeslot[] };

/** ========== Internal compute types ========== */
interface LocationConfig {
  id: string;
  timeZone: string;
  slotDurationMinutes: number;
  customerBookingLeadMinutes: number;
  customerBookingMaxMonthsAhead: number;
  timeSlotStrategy: TimeSlotStrategy;
}
interface Staff {
  id: string;
  locationId: string;
  operatingHours: RegularSchedule | null;
}
interface ScheduleOverride {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  operatingHours: RegularSchedule;
}
interface Unavailability {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  startTime?: HHMM;
  endTime?: HHMM;
}
interface AssignmentInterval {
  staffId: string;
  startUtcIso: string;
  endUtcIso: string;
}
interface IntervalUtc {
  start: Date;
  end: Date;
}

/** ========== Error helpers ========== */
function jsonErr(
  status: number,
  message: string,
  details?: unknown,
  step?: string,
  errMsg?: string
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (step) headers["X-Error-Step"] = step;
  if (errMsg) headers["X-Error-Message"] = errMsg.slice(0, 300);
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers,
  });
}

/** ========== Safe TZ + Date utils (no-throw) ========== */
function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(0);
    return true;
  } catch {
    return false;
  }
}
function safeTimeZone(tz: string | null | undefined): string {
  if (tz && isValidTimeZone(tz)) return tz;
  return "UTC";
}
function makeUtcFromLocalSafe(
  dateIso: string,
  timeHm: HHMM | "24:00",
  timeZone: string
): Date {
  try {
    const [Y, M, D] = dateIso.split("-").map(Number);
    const [h, m] = timeHm.split(":").map(Number);
    const candidate = new Date(Date.UTC(Y, M - 1, D, h, m, 0));
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = fmt.formatToParts(candidate);
    const year = Number(parts.find((p) => p.type === "year")?.value ?? Y);
    const month = Number(parts.find((p) => p.type === "month")?.value ?? M);
    const day = Number(parts.find((p) => p.type === "day")?.value ?? D);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? h);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? m);
    const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);
    const asIfLocal = Date.UTC(year, month - 1, day, hour, minute, second);
    const offsetMs = asIfLocal - candidate.getTime();
    return new Date(candidate.getTime() - offsetMs);
  } catch {
    // Fallback to UTC math — never throw
    const [Y, M, D] = dateIso.split("-").map(Number);
    const [h, m] = timeHm.split(":").map(Number);
    return new Date(Date.UTC(Y, M - 1, D, h, m, 0));
  }
}
function toLocalHmSafe(dUtc: Date, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = fmt.formatToParts(dUtc);
    const h = parts.find((p) => p.type === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${h}:${m}`;
  } catch {
    // Fallback to UTC
    const h = String(dUtc.getUTCHours()).padStart(2, "0");
    const m = String(dUtc.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
}
function weekdayShortKeySafe(
  dateIso: string,
  timeZone: string
): keyof RegularSchedule {
  try {
    const d = new Date(dateIso + "T00:00:00.000Z");
    const w = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" })
      .format(d)
      .toLowerCase();
    const map: Record<string, keyof RegularSchedule> = {
      mon: "mon",
      tue: "tue",
      wed: "wed",
      thu: "thu",
      fri: "fri",
      sat: "sat",
      sun: "sun",
    };
    return map[w] ?? "sun";
  } catch {
    return "sun";
  }
}

/** ========== Generic helpers ========== */
function daterangeToBounds(
  r: string
): { startDate: string; endDate: string } | null {
  if (r.length < 2) return null;
  const inner = r.slice(1, -1).replace(/\s+/g, "").replace(/"/g, "");
  const idx = inner.indexOf(",");
  if (idx === -1) return null;
  const start = inner.slice(0, idx);
  const end = inner.slice(idx + 1);
  if (!start || !end) return null;
  return { startDate: start, endDate: end };
}
function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60000);
}
function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}
function intersectInterval(a: IntervalUtc, b: IntervalUtc): IntervalUtc | null {
  const start = a.start > b.start ? a.start : b.start;
  const end = a.end < b.end ? a.end : b.end;
  return end > start ? { start, end } : null;
}
function containsInterval(container: IntervalUtc, inner: IntervalUtc): boolean {
  return container.start <= inner.start && container.end >= inner.end;
}
function subtractIntervals(
  base: IntervalUtc[],
  blocks: IntervalUtc[]
): IntervalUtc[] {
  let out = [...base];
  for (const blk of blocks) {
    const next: IntervalUtc[] = [];
    for (const it of out) {
      if (blk.end <= it.start || blk.start >= it.end) {
        next.push(it);
        continue;
      }
      if (blk.start > it.start)
        next.push({ start: it.start, end: new Date(blk.start) });
      if (blk.end < it.end)
        next.push({ start: new Date(blk.end), end: it.end });
    }
    out = next.filter((x) => x.end > x.start);
  }
  return out;
}
function alignToSlot(d: Date, slotMinutes: number): Date {
  const mins = d.getUTCMinutes();
  const rem = mins % slotMinutes;
  return rem === 0 ? d : new Date(d.getTime() + (slotMinutes - rem) * 60000);
}

/** ========== Planner (aggregate only) ========== */
function buildWorkingIntervalsUtc(
  staff: Staff,
  staffOverrides: ReadonlyArray<ScheduleOverride>,
  dateIso: string,
  tz: string
): IntervalUtc[] {
  const ov = staffOverrides.find(
    (o) => dateIso >= o.startDate && dateIso <= o.endDate
  );
  const schedule = ov?.operatingHours ?? staff.operatingHours;
  if (!schedule) return [];
  const key = weekdayShortKeySafe(dateIso, tz);
  const local = schedule[key] ?? [];
  const dayStartUtc = makeUtcFromLocalSafe(dateIso, "00:00", tz);
  const dayEndUtc = makeUtcFromLocalSafe(dateIso, "24:00", tz);
  const out: IntervalUtc[] = [];
  for (const iv of local) {
    const s = makeUtcFromLocalSafe(dateIso, iv.start, tz);
    const e = makeUtcFromLocalSafe(dateIso, iv.end, tz);
    if (e <= s) continue;
    const clip = intersectInterval(
      { start: s, end: e },
      { start: dayStartUtc, end: dayEndUtc }
    );
    if (clip) out.push(clip);
  }
  return out;
}
function buildUnavailabilityBlocksUtc(
  staffUnavs: ReadonlyArray<Unavailability>,
  dateIso: string,
  tz: string
): IntervalUtc[] {
  const blocks: IntervalUtc[] = [];
  for (const u of staffUnavs) {
    const sHm: HHMM = (u.startTime ?? "00:00") as HHMM;
    const eHm: HHMM = (u.endTime ?? "24:00") as HHMM;
    const s = makeUtcFromLocalSafe(dateIso, sHm, tz);
    const e = makeUtcFromLocalSafe(dateIso, eHm, tz);
    if (e > s) blocks.push({ start: s, end: e });
  }
  return blocks;
}
function buildBookedBlocksUtc(
  staffId: string,
  assignments: ReadonlyArray<AssignmentInterval>,
  dayStartUtc: Date,
  dayEndUtc: Date
): IntervalUtc[] {
  const blocks: IntervalUtc[] = [];
  for (const a of assignments) {
    if (a.staffId !== staffId) continue;
    const s = new Date(a.startUtcIso);
    const e = new Date(a.endUtcIso);
    const inter = intersectInterval(
      { start: s, end: e },
      { start: dayStartUtc, end: dayEndUtc }
    );
    if (inter) blocks.push(inter);
  }
  return blocks;
}
function applyStrategyFilter(
  strategy: TimeSlotStrategy,
  chainIntervalsByStaff: Record<string, ReadonlyArray<IntervalUtc>>,
  chainAssignments: ReadonlyArray<{ staffId: string; start: Date; end: Date }>,
  slotMinutes: number
): boolean {
  if (strategy === "REGULAR") return true;
  if (strategy === "ELIMINATE_GAPS") {
    const first = chainAssignments[0];
    const last = chainAssignments[chainAssignments.length - 1];
    const firstOk = (chainIntervalsByStaff[first.staffId] ?? []).some(
      (iv) => iv.start.getTime() === first.start.getTime()
    );
    const lastOk = (chainIntervalsByStaff[last.staffId] ?? []).some(
      (iv) => iv.end.getTime() === last.end.getTime()
    );
    return firstOk || lastOk;
  }
  const first = chainAssignments[0];
  const last = chainAssignments[chainAssignments.length - 1];
  const firstIv = (chainIntervalsByStaff[first.staffId] ?? []).find((iv) =>
    containsInterval(iv, { start: first.start, end: first.end })
  );
  const lastIv = (chainIntervalsByStaff[last.staffId] ?? []).find((iv) =>
    containsInterval(iv, { start: last.start, end: last.end })
  );
  if (!firstIv || !lastIv) return true;
  const gapBefore = minutesBetween(firstIv.start, first.start);
  const gapAfter = minutesBetween(last.end, lastIv.end);
  return (
    (gapBefore === 0 || gapBefore >= slotMinutes) &&
    (gapAfter === 0 || gapAfter >= slotMinutes)
  );
}

function computeLocationTimeslots(params: {
  dateIso: string;
  location: LocationConfig;
  services: ReadonlyArray<{ serviceId: string; staffId: string | null }>;
  locationServices: ReadonlyArray<{ id: string; durationMinutes: number }>;
  staff: ReadonlyArray<Staff>;
  overridesByStaff: ReadonlyMap<string, ReadonlyArray<ScheduleOverride>>;
  unavByStaff: ReadonlyMap<string, ReadonlyArray<Unavailability>>;
  assignments: ReadonlyArray<AssignmentInterval>;
  nowUtc?: Date;
}): Timeslot[] {
  const {
    dateIso,
    location,
    services,
    locationServices,
    staff,
    overridesByStaff,
    unavByStaff,
    assignments,
  } = params;

  const tz = location.timeZone;
  const now = params.nowUtc ?? new Date();

  const today = new Date();
  const maxAhead = new Date(today);
  maxAhead.setMonth(
    maxAhead.getMonth() + location.customerBookingMaxMonthsAhead
  );
  if (new Date(`${dateIso}T00:00:00Z`) > maxAhead) return [];

  const dayStartUtc = makeUtcFromLocalSafe(dateIso, "00:00", tz);
  const dayEndUtc = makeUtcFromLocalSafe(dateIso, "24:00", tz);
  const leadOkStartUtc = addMinutes(now, location.customerBookingLeadMinutes);

  const freeByStaff: Record<string, IntervalUtc[]> = {};
  for (const s of staff) {
    if (s.locationId !== location.id) continue;

    const sOverrides = overridesByStaff.get(s.id) ?? [];
    let intervals = buildWorkingIntervalsUtc(s, sOverrides, dateIso, tz);

    if (intervals.length) {
      const sUnav = unavByStaff.get(s.id) ?? [];
      const unavBlocks = buildUnavailabilityBlocksUtc(sUnav, dateIso, tz);
      if (unavBlocks.length)
        intervals = subtractIntervals(intervals, unavBlocks);
    }

    if (intervals.length) {
      const bookedBlocks = buildBookedBlocksUtc(
        s.id,
        assignments,
        dayStartUtc,
        dayEndUtc
      );
      if (bookedBlocks.length)
        intervals = subtractIntervals(intervals, bookedBlocks);
    }

    intervals = intervals
      .map((iv) =>
        intersectInterval(iv, { start: dayStartUtc, end: dayEndUtc })
      )
      .filter((iv): iv is IntervalUtc => iv !== null);

    freeByStaff[s.id] = intervals;
  }

  if (!Object.values(freeByStaff).some((iv) => iv.length)) return [];

  const durationByService = new Map<string, number>(
    locationServices.map((ls) => [ls.id, ls.durationMinutes])
  );
  const requested = services.map((sr) => ({
    serviceId: sr.serviceId,
    staffId: sr.staffId,
  }));
  const hasAnyStaffPin = requested.some((r) => r.staffId !== null);
  const totalDuration = requested.reduce(
    (sum, r) => sum + (durationByService.get(r.serviceId) ?? 0),
    0
  );

  const allStaffIds = staff.map((s) => s.id);
  const serviceCandidates = requested.map((r) => ({
    serviceId: r.serviceId,
    duration: durationByService.get(r.serviceId) ?? 0,
    staffIds: r.staffId ? [r.staffId] : allStaffIds,
  }));

  const slot = location.slotDurationMinutes;
  const earliestStartUtc = alignToSlot(dayStartUtc, slot);
  const results: Timeslot[] = [];
  const MAX_RESULTS = 300;

  for (let t = earliestStartUtc; t < dayEndUtc; t = addMinutes(t, slot)) {
    if (t < leadOkStartUtc) continue;

    // Prefer single-staff placement when no pins & multi-service
    if (!hasAnyStaffPin && serviceCandidates.length > 1) {
      let singleFound = false;
      for (const staffId of allStaffIds) {
        const ivs = freeByStaff[staffId] ?? [];
        const endNeeded = addMinutes(t, totalDuration);
        const covering = ivs.find((iv) => iv.start <= t && iv.end >= endNeeded);
        if (!covering) continue;

        let cursor = t;
        const assigns = serviceCandidates.map((sc) => {
          const start = cursor;
          const end = addMinutes(cursor, sc.duration);
          cursor = end;
          return { staffId, start, end, serviceId: sc.serviceId };
        });

        if (
          applyStrategyFilter(
            location.timeSlotStrategy,
            { [staffId]: ivs },
            assigns,
            slot
          )
        ) {
          results.push({
            startLocal: toLocalHmSafe(assigns[0].start, tz),
            endLocal: toLocalHmSafe(assigns[assigns.length - 1].end, tz),
            timeZone: tz,
            assignments: assigns.map((a) => ({
              serviceId: a.serviceId,
              staffId: a.staffId,
              startLocal: toLocalHmSafe(a.start, tz),
              endLocal: toLocalHmSafe(a.end, tz),
            })),
          });
          singleFound = true;
        }
        if (singleFound) break;
      }
      if (singleFound) {
        if (results.length >= MAX_RESULTS) break;
        continue;
      }
    }

    // Multi-staff chain fallback
    const chainAssignments: Array<{
      staffId: string;
      start: Date;
      end: Date;
      serviceId: string;
    }> = [];
    let currentStart = t;
    let feasible = true;
    const chainIntervalsByStaff: Record<string, IntervalUtc[]> = {};

    for (const sc of serviceCandidates) {
      const serviceEnd = addMinutes(currentStart, sc.duration);
      let pickedStaff: string | null = null;

      for (const staffId of sc.staffIds) {
        const intervals = freeByStaff[staffId] ?? [];
        chainIntervalsByStaff[staffId] = intervals;
        const covering = intervals.find(
          (iv) => iv.start <= currentStart && iv.end >= serviceEnd
        );
        if (covering) {
          pickedStaff = staffId;
          break;
        }
      }

      if (!pickedStaff) {
        feasible = false;
        break;
      }
      chainAssignments.push({
        staffId: pickedStaff,
        start: currentStart,
        end: serviceEnd,
        serviceId: sc.serviceId,
      });
      currentStart = serviceEnd;
    }

    if (!feasible) continue;
    if (
      !applyStrategyFilter(
        location.timeSlotStrategy,
        chainIntervalsByStaff,
        chainAssignments,
        slot
      )
    )
      continue;

    results.push({
      startLocal: toLocalHmSafe(chainAssignments[0].start, tz),
      endLocal: toLocalHmSafe(
        chainAssignments[chainAssignments.length - 1].end,
        tz
      ),
      timeZone: tz,
      assignments: chainAssignments.map((a) => ({
        serviceId: a.serviceId,
        staffId: a.staffId,
        startLocal: toLocalHmSafe(a.start, tz),
        endLocal: toLocalHmSafe(a.end, tz),
      })),
    });

    if (results.length >= MAX_RESULTS) break;
  }

  return results;
}

/** ========== ETag (pure TS FNV-1a 64) ========== */
function fnv1a64Hex(str: string): string {
  let h = 0xcbf29ce484222325n;
  const p = 0x100000001b3n;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h = (h * p) & 0xffff_ffff_ffff_ffffn;
  }
  return h.toString(16).padStart(16, "0");
}
function makeETag(input: {
  dateIso: string;
  locationId: string;
  services: ReadonlyArray<{
    serviceId: string;
    staffId: string | null;
    order?: number;
  }>;
}): string {
  const sequence = input.services.map((s, idx) => ({
    serviceId: s.serviceId,
    staffId: s.staffId,
    order: s.order ?? idx,
  }));
  const canon = JSON.stringify({
    dateIso: input.dateIso,
    locationId: input.locationId,
    services: sequence,
  });
  return `W/"${fnv1a64Hex(canon)}"`;
}

/** ========== Cache ========== */
const CACHE_TTL_MS = 30_000;
const cacheStore: Map<string, { ts: number; body: string; etag: string }> =
  (
    globalThis as {
      ___TS_CACHE__?: Map<string, { ts: number; body: string; etag: string }>;
    }
  ).___TS_CACHE__ ?? new Map();
(globalThis as { ___TS_CACHE__: typeof cacheStore }).___TS_CACHE__ = cacheStore;

/** ========== Supabase (service role only) ========== */
function createServiceClient(): SupabaseClient<Database> | Response {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url)
      return jsonErr(
        500,
        "Missing SUPABASE_URL env",
        undefined,
        "init.env",
        "SUPABASE_URL"
      );
    if (!serviceKey)
      return jsonErr(
        500,
        "Missing SUPABASE_SERVICE_ROLE_KEY env",
        undefined,
        "init.env",
        "SUPABASE_SERVICE_ROLE_KEY"
      );
    return createClient<Database>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "compute-timeslots" } },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonErr(500, "Client init failed", undefined, "init.client", msg);
  }
}

/** ========== HTTP handler ========== */
serve(async (req: Request): Promise<Response> => {
  try {
    // 1) Parse & validate
    let raw: unknown = null;
    try {
      raw = await req.json();
    } catch {
      /* keep null */
    }
    const parsed = payloadSchema.safeParse(raw);
    if (!parsed.success)
      return jsonErr(
        400,
        "Invalid payload",
        parsed.error.flatten(),
        "validate"
      );

    const { dateIso, locationId, services } = parsed.data as ComputeRequest;
    const ordered = [...services].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    // 2) ETag & small cache
    const etag = makeETag({
      dateIso,
      locationId,
      services: ordered.map((s) => ({
        serviceId: s.serviceId,
        staffId: s.staffId ?? null,
        order: s.order,
      })),
    });

    const inm = req.headers.get("if-none-match");
    if (inm && inm === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control":
            "public, max-age=30, s-maxage=30, stale-while-revalidate=30",
        },
      });
    }

    const cached = cacheStore.get(etag);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(cached.body, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ETag: cached.etag,
          "Cache-Control":
            "public, max-age=30, s-maxage=30, stale-while-revalidate=30",
        },
      });
    }

    // 3) Supabase
    const supaOrRes = createServiceClient();
    if (supaOrRes instanceof Response) return supaOrRes;
    const supabase = supaOrRes;

    // 4) Location (and harden timezone)
    const locStep = "read.location";
    const { data: loc, error: locErr } = await supabase
      .from("Location")
      .select(
        "id, timezone, slotDurationMinutes, customerBookingLeadMinutes, customerBookingMaxMonthsAhead, timeSlotStrategy, allowCustomerSelectTeamMember"
      )
      .eq("id", locationId)
      .maybeSingle();
    if (locErr)
      return jsonErr(500, locErr.message, undefined, locStep, locErr.message);
    if (!loc) return jsonErr(404, "Location not found", undefined, locStep);

    const tz = safeTimeZone(loc.timezone);
    const location: LocationConfig = {
      id: loc.id,
      timeZone: tz,
      slotDurationMinutes: loc.slotDurationMinutes,
      customerBookingLeadMinutes: loc.customerBookingLeadMinutes,
      customerBookingMaxMonthsAhead: loc.customerBookingMaxMonthsAhead,
      timeSlotStrategy: loc.timeSlotStrategy,
    };

    // Respect allowCustomerSelectTeamMember
    const normalized = (
      loc.allowCustomerSelectTeamMember
        ? ordered
        : ordered.map((s) => ({ ...s, staffId: null }))
    ).map((s) => ({
      serviceId: s.serviceId,
      staffId: s.staffId ?? null,
      order: s.order,
    }));

    // 5) Staff
    const staffStep = "read.staff";
    const { data: staffRows, error: staffErr } = await supabase
      .from("User")
      .select("id, locationId, operatingHours")
      .eq("locationId", locationId);
    if (staffErr)
      return jsonErr(
        500,
        staffErr.message,
        undefined,
        staffStep,
        staffErr.message
      );

    const staff: Staff[] = (staffRows ?? []).map((r) => ({
      id: r.id,
      locationId: r.locationId,
      operatingHours: r.operatingHours,
    }));
    if (staff.length === 0) {
      const body = JSON.stringify({ data: [] as Timeslot[] });
      cacheStore.set(etag, { ts: Date.now(), body, etag });
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: etag },
      });
    }
    const staffIdsAll = staff.map((s) => s.id);

    // 6) Closures (filter in code)
    const closStep = "read.closures";
    const { data: closureRows, error: closureErr } = await supabase
      .from("LocationClosure")
      .select("dateRange")
      .eq("locationId", locationId);
    if (closureErr)
      return jsonErr(
        500,
        closureErr.message,
        undefined,
        closStep,
        closureErr.message
      );
    const isClosed = (closureRows ?? []).some((r) => {
      const b = r.dateRange ? daterangeToBounds(r.dateRange) : null;
      return b ? dateIso >= b.startDate && dateIso <= b.endDate : false;
    });
    if (isClosed) {
      const body = JSON.stringify({ data: [] as Timeslot[] });
      cacheStore.set(etag, { ts: Date.now(), body, etag });
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ETag: etag,
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    // 7) Services (only requested)
    const requestedServiceIds = normalized.map((s) => s.serviceId);
    const svcStep = "read.services";
    const { data: svcRows, error: svcErr } = await supabase
      .from("LocationService")
      .select("id, durationMinutes, locationId, isActive")
      .eq("locationId", locationId)
      .eq("isActive", true)
      .in("id", requestedServiceIds);
    if (svcErr)
      return jsonErr(500, svcErr.message, undefined, svcStep, svcErr.message);
    const locationServices = (svcRows ?? []).map((s) => ({
      id: s.id,
      durationMinutes: s.durationMinutes,
    }));

    // 8) Overrides & Unavailability (scope by staff; filter day in code)
    const ovStep = "read.overrides";
    const unStep = "read.unavailability";
    const [ovRes, unRes] = await Promise.all([
      supabase
        .from("StaffScheduleOverride")
        .select("id, staffId, dateRange, operatingHours")
        .in("staffId", staffIdsAll),
      supabase
        .from("StaffUnavailability")
        .select("id, staffId, dateRange, startTime, endTime")
        .in("staffId", staffIdsAll),
    ]);
    if (ovRes.error)
      return jsonErr(
        500,
        ovRes.error.message,
        undefined,
        ovStep,
        ovRes.error.message
      );
    if (unRes.error)
      return jsonErr(
        500,
        unRes.error.message,
        undefined,
        unStep,
        unRes.error.message
      );

    const overridesByStaff = new Map<string, ScheduleOverride[]>();
    for (const r of ovRes.data ?? []) {
      const b = r.dateRange ? daterangeToBounds(r.dateRange) : null;
      if (!b) continue;
      if (!(dateIso >= b.startDate && dateIso <= b.endDate)) continue;
      const o: ScheduleOverride = {
        id: r.id,
        staffId: r.staffId,
        startDate: b.startDate,
        endDate: b.endDate,
        operatingHours: r.operatingHours,
      };
      const arr = overridesByStaff.get(o.staffId) ?? [];
      arr.push(o);
      overridesByStaff.set(o.staffId, arr);
    }

    const unavByStaff = new Map<string, Unavailability[]>();
    for (const r of unRes.data ?? []) {
      const b = r.dateRange ? daterangeToBounds(r.dateRange) : null;
      if (!b) continue;
      if (!(dateIso >= b.startDate && dateIso <= b.endDate)) continue;
      const u: Unavailability = {
        id: r.id,
        staffId: r.staffId,
        startDate: b.startDate,
        endDate: b.endDate,
        startTime: r.startTime ?? undefined,
        endTime: r.endTime ?? undefined,
      };
      const arr = unavByStaff.get(u.staffId) ?? [];
      arr.push(u);
      unavByStaff.set(u.staffId, arr);
    }

    // 9) Assignments — day bounded
    const assignStep = "read.assignments";
    const dayStartUtc = makeUtcFromLocalSafe(dateIso, "00:00", tz);
    const dayEndUtc = makeUtcFromLocalSafe(dateIso, "24:00", tz);
    const { data: assignRows, error: assignErr } = await supabase
      .from("BookingServiceAssignment")
      .select("employeeId, startTime, endTime")
      .in("employeeId", staffIdsAll)
      .lt("startTime", dayEndUtc.toISOString())
      .gt("endTime", dayStartUtc.toISOString());
    if (assignErr)
      return jsonErr(
        500,
        assignErr.message,
        undefined,
        assignStep,
        assignErr.message
      );
    const assignments: AssignmentInterval[] = (assignRows ?? []).map((r) => ({
      staffId: r.employeeId,
      startUtcIso: r.startTime,
      endUtcIso: r.endTime,
    }));

    // 10) Compute
    let results: Timeslot[] = [];
    try {
      results = computeLocationTimeslots({
        dateIso,
        location,
        services: normalized.map((s) => ({
          serviceId: s.serviceId,
          staffId: s.staffId,
        })),
        locationServices,
        staff,
        overridesByStaff,
        unavByStaff,
        assignments,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return jsonErr(500, "Planner failed", undefined, "compute", msg);
    }

    const body = JSON.stringify({ data: results } as ComputeResponse);
    cacheStore.set(etag, { ts: Date.now(), body, etag });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control":
          "public, max-age=30, s-maxage=30, stale-while-revalidate=30",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonErr(500, msg, undefined, "catch", msg);
  }
});
