export interface ServiceRequest {
  serviceId: string;
  staffId?: string | null;
}

export interface LocationConfig {
  id: string;
  timeZone: string; // IANA
  slotDurationMinutes: number;
  customerBookingLeadMinutes: number;
  customerBookingMaxMonthsAhead: number;
  timeSlotStrategy: "REGULAR" | "REDUCE_GAPS" | "ELIMINATE_GAPS";
}

export interface LocationServiceInfo {
  id: string;
  durationMinutes: number;
}

interface OperatingDay {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  isWorking: boolean;
  breaks?: Array<{ start: string; end: string }>; // local times
}

export interface OperatingWeek {
  monday?: OperatingDay;
  tuesday?: OperatingDay;
  wednesday?: OperatingDay;
  thursday?: OperatingDay;
  friday?: OperatingDay;
  saturday?: OperatingDay;
  sunday?: OperatingDay;
}

export interface Staff {
  id: string;
  locationId: string;
  operatingHours: OperatingWeek | null;
}

export interface ScheduleOverride {
  id: string;
  staffId: string;
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string; // YYYY-MM-DD inclusive
  operatingHours: OperatingWeek;
}

export interface Unavailability {
  id: string;
  staffId: string;
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string; // YYYY-MM-DD inclusive
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

export interface AssignmentInterval {
  staffId: string;
  startUtcIso: string; // ISO timestamptz
  endUtcIso: string; // ISO timestamptz
}

export interface StaffCapability {
  staffId: string;
  serviceId: string; // LocationService.id
}

interface TimeslotAssignment {
  serviceId: string;
  staffId: string;
  startLocal: string; // HH:mm
  endLocal: string; // HH:mm
}

export interface TimeslotResult {
  startLocal: string; // HH:mm
  endLocal: string; // HH:mm
  assignments: TimeslotAssignment[];
  timeZone: string;
}

interface IntervalUtc {
  start: Date; // UTC
  end: Date; // UTC
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60000);
}

function toDateParts(dateIso: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateIso.split("-").map((x) => parseInt(x, 10));
  return { y, m, d };
}

function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  return { h, m };
}

export function makeUtcFromLocal(
  dateIso: string,
  timeHm: string,
  timeZone: string
): Date {
  const { y, m, d } = toDateParts(dateIso);
  const { h, m: mi } = parseHm(timeHm);
  const zoned = new Date(Date.UTC(y, m - 1, d, h, mi, 0));
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
  const parts = fmt.formatToParts(zoned);
  const comp = {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
    hour: Number(parts.find((p) => p.type === "hour")?.value),
    minute: Number(parts.find((p) => p.type === "minute")?.value),
    second: Number(parts.find((p) => p.type === "second")?.value),
  };
  const asIfLocal = Date.UTC(
    comp.year,
    comp.month - 1,
    comp.day,
    comp.hour,
    comp.minute,
    comp.second
  );
  const offsetMs = asIfLocal - zoned.getTime();
  return new Date(zoned.getTime() - offsetMs);
}

function weekdayNameFromDateIso(
  dateIso: string,
  timeZone: string
): keyof OperatingWeek {
  const d = new Date(dateIso + "T00:00:00.000Z");
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" });
  const name = fmt.format(d).toLowerCase();
  switch (name) {
    case "monday":
      return "monday";
    case "tuesday":
      return "tuesday";
    case "wednesday":
      return "wednesday";
    case "thursday":
      return "thursday";
    case "friday":
      return "friday";
    case "saturday":
      return "saturday";
    default:
      return "sunday";
  }
}

function getOperatingDayForDate(
  base: OperatingWeek | null,
  overrides: ScheduleOverride[],
  dateIso: string,
  timeZone: string
) {
  const inOverride = overrides.find(
    (o) => dateIso >= o.startDate && dateIso <= o.endDate
  );
  const week = inOverride ? inOverride.operatingHours : base;
  const weekday = weekdayNameFromDateIso(dateIso, timeZone);
  const day = (week ?? {})[weekday];
  if (!day || !day.isWorking) return null;
  return day;
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

function intersectInterval(a: IntervalUtc, b: IntervalUtc): IntervalUtc | null {
  const start = a.start > b.start ? a.start : b.start;
  const end = a.end < b.end ? a.end : b.end;
  return end > start ? { start, end } : null;
}

function containsInterval(container: IntervalUtc, inner: IntervalUtc): boolean {
  return container.start <= inner.start && container.end >= inner.end;
}

function buildWorkingIntervalsUtc(
  staff: Staff,
  overrides: ScheduleOverride[],
  dateIso: string,
  timeZone: string
): IntervalUtc[] {
  const day = getOperatingDayForDate(
    staff.operatingHours,
    overrides.filter((o) => o.staffId === staff.id),
    dateIso,
    timeZone
  );
  if (!day) return [];
  const baseStartUtc = makeUtcFromLocal(dateIso, day.start, timeZone);
  const baseEndUtc = makeUtcFromLocal(dateIso, day.end, timeZone);
  let intervals: IntervalUtc[] =
    baseStartUtc < baseEndUtc ? [{ start: baseStartUtc, end: baseEndUtc }] : [];
  const breaks = day.breaks ?? [];
  for (const b of breaks) {
    const bStart = makeUtcFromLocal(dateIso, b.start, timeZone);
    const bEnd = makeUtcFromLocal(dateIso, b.end, timeZone);
    intervals = subtractIntervals(intervals, [{ start: bStart, end: bEnd }]);
  }
  return intervals;
}

function buildUnavailabilityBlocksUtc(
  staffId: string,
  unavs: Unavailability[],
  dateIso: string,
  timeZone: string
): IntervalUtc[] {
  const blocks: IntervalUtc[] = [];
  for (const u of unavs) {
    if (u.staffId !== staffId) continue;
    if (dateIso < u.startDate || dateIso > u.endDate) continue;
    const sHm = u.startTime ?? "00:00";
    const eHm = u.endTime ?? "24:00";
    const s = makeUtcFromLocal(dateIso, sHm, timeZone);
    const e = makeUtcFromLocal(dateIso, eHm, timeZone);
    if (e > s) blocks.push({ start: s, end: e });
  }
  return blocks;
}

function buildBookedBlocksUtc(
  staffId: string,
  assignments: AssignmentInterval[],
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

function alignToSlot(d: Date, slotMinutes: number): Date {
  const mins = d.getUTCMinutes();
  const rem = mins % slotMinutes;
  return rem === 0 ? d : new Date(d.getTime() + (slotMinutes - rem) * 60000);
}

function toLocalHm(dUtc: Date, timeZone: string): string {
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
}

function applyStrategyFilter(
  strategy: LocationConfig["timeSlotStrategy"],
  chainIntervalsByStaff: Record<string, IntervalUtc[]>,
  chainAssignments: { staffId: string; start: Date; end: Date }[],
  slotMinutes: number
): boolean {
  if (strategy === "REGULAR") return true;
  if (strategy === "ELIMINATE_GAPS") {
    const first = chainAssignments[0];
    const last = chainAssignments[chainAssignments.length - 1];
    const firstIntervals = chainIntervalsByStaff[first.staffId];
    const lastIntervals = chainIntervalsByStaff[last.staffId];
    const firstOk = firstIntervals.some(
      (iv) => iv.start.getTime() === first.start.getTime()
    );
    const lastOk = lastIntervals.some(
      (iv) => iv.end.getTime() === last.end.getTime()
    );
    return firstOk || lastOk;
  }
  const first = chainAssignments[0];
  const last = chainAssignments[chainAssignments.length - 1];
  const firstIv = chainIntervalsByStaff[first.staffId].find((iv) =>
    containsInterval(iv, { start: first.start, end: first.end })
  );
  const lastIv = chainIntervalsByStaff[last.staffId].find((iv) =>
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

export function computeLocationTimeslots(params: {
  dateIso: string; // local date YYYY-MM-DD
  location: LocationConfig;
  services: ServiceRequest[];
  locationServices: LocationServiceInfo[];
  staff: Staff[];
  staffCapabilities: StaffCapability[];
  scheduleOverrides: ScheduleOverride[];
  unavailabilities: Unavailability[];
  existingAssignments: AssignmentInterval[];
  nowUtc?: Date;
}): TimeslotResult[] {
  const {
    dateIso,
    location,
    services,
    locationServices,
    staff,
    staffCapabilities,
    scheduleOverrides,
    unavailabilities,
    existingAssignments,
  } = params;
  const now = params.nowUtc ?? new Date();
  const tz = location.timeZone;

  const leadOkStartUtc = addMinutes(now, location.customerBookingLeadMinutes);
  const today = new Date();
  const maxAhead = new Date(today);
  maxAhead.setMonth(
    maxAhead.getMonth() + location.customerBookingMaxMonthsAhead
  );
  const dateObj = new Date(dateIso + "T00:00:00Z");
  if (dateObj > maxAhead) return [];

  const dayStartUtc = makeUtcFromLocal(dateIso, "00:00", tz);
  const dayEndUtc = makeUtcFromLocal(dateIso, "24:00", tz);

  const freeByStaff: Record<string, IntervalUtc[]> = {};
  for (const s of staff) {
    if (s.locationId !== location.id) continue;
    let intervals = buildWorkingIntervalsUtc(s, scheduleOverrides, dateIso, tz);
    if (intervals.length === 0) {
      freeByStaff[s.id] = [];
      continue;
    }
    const unavBlocks = buildUnavailabilityBlocksUtc(
      s.id,
      unavailabilities,
      dateIso,
      tz
    );
    if (unavBlocks.length) intervals = subtractIntervals(intervals, unavBlocks);
    const bookedBlocks = buildBookedBlocksUtc(
      s.id,
      existingAssignments,
      dayStartUtc,
      dayEndUtc
    );
    if (bookedBlocks.length)
      intervals = subtractIntervals(intervals, bookedBlocks);
    intervals = intervals
      .map((iv) =>
        intersectInterval(iv, { start: dayStartUtc, end: dayEndUtc })
      )
      .filter((iv): iv is IntervalUtc => !!iv);
    freeByStaff[s.id] = intervals;
  }

  const durationByService = new Map(
    locationServices.map((ls) => [ls.id, ls.durationMinutes])
  );
  const serviceCandidates: {
    serviceId: string;
    duration: number;
    staffIds: string[];
  }[] = services.map((sr) => {
    const duration = durationByService.get(sr.serviceId) ?? 0;
    if (sr.staffId)
      return { serviceId: sr.serviceId, duration, staffIds: [sr.staffId] };
    const candidates = staffCapabilities
      .filter((c) => c.serviceId === sr.serviceId)
      .map((c) => c.staffId);
    return { serviceId: sr.serviceId, duration, staffIds: candidates };
  });

  const slot = location.slotDurationMinutes;
  const earliestStartUtc = alignToSlot(dayStartUtc, slot);
  const results: TimeslotResult[] = [];

  for (let t = earliestStartUtc; t < dayEndUtc; t = addMinutes(t, slot)) {
    if (t < leadOkStartUtc) continue;

    const chainAssignments: {
      staffId: string;
      start: Date;
      end: Date;
      serviceId: string;
    }[] = [];
    let currentStart = t;
    let feasible = true;
    const chainIntervalsByStaff: Record<string, IntervalUtc[]> = {};

    for (const sc of serviceCandidates) {
      const serviceEnd = addMinutes(currentStart, sc.duration);
      let picked: { staffId: string; covering: IntervalUtc } | null = null;
      for (const staffId of sc.staffIds) {
        const intervals = freeByStaff[staffId] ?? [];
        chainIntervalsByStaff[staffId] = intervals;
        const covering = intervals.find(
          (iv) => iv.start <= currentStart && iv.end >= serviceEnd
        );
        if (covering) {
          picked = { staffId, covering };
          break;
        }
      }
      if (!picked) {
        feasible = false;
        break;
      }
      chainAssignments.push({
        staffId: picked.staffId,
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

    const startLocal = toLocalHm(chainAssignments[0].start, tz);
    const endLocal = toLocalHm(
      chainAssignments[chainAssignments.length - 1].end,
      tz
    );
    const assignments = chainAssignments.map((a) => ({
      serviceId: a.serviceId,
      staffId: a.staffId,
      startLocal: toLocalHm(a.start, tz),
      endLocal: toLocalHm(a.end, tz),
    }));
    results.push({ startLocal, endLocal, assignments, timeZone: tz });
  }

  return results;
}
