# compute-timeslots

HTTP POST function that returns **all available timeslots** for a given location and date, applying every scheduling rule and customization.

## Request

`POST /functions/v1/compute-timeslots`

```json
{
  "dateIso": "2025-09-17",
  "locationId": "<location-uuid>",
  "services": [
    { "serviceId": "<locationServiceId1>", "order": 0 },
    { "serviceId": "<locationServiceId2>", "staffId": "<optional-staff-uuid>", "order": 1 }
  ]
}
```

### Parameters
| Field | Type | Required | Description |
|------|------|---------|-------------|
| `dateIso` | string | ✓ | Local date for the location’s time zone, format **YYYY-MM-DD** |
| `locationId` | UUID | ✓ | Target location |
| `services` | array | ✓ | Sequential service chain. Each object needs a `serviceId`. |
| `services[].staffId` | UUID | ✗ | Pin this service to a specific staff member (if omitted, any available staff can be used). |
| `services[].order` | number | ✗ | Execution order. If omitted, services are taken in the array order. |

> **Note:** The old `mode` and `staffIds` parameters have been removed.  
> The function now **always returns a single aggregated list of slots**.

---

## Response

```json
{
  "data": [
    {
      "startLocal": "09:00",
      "endLocal": "10:30",
      "timeZone": "Europe/Rome",
      "assignments": [
        { "serviceId": "<svc1>", "staffId": "<staffA>", "startLocal": "09:00", "endLocal": "09:45" },
        { "serviceId": "<svc2>", "staffId": "<staffB>", "startLocal": "09:45", "endLocal": "10:30" }
      ]
    }
  ]
}
```

* Each object represents one **bookable chain** of the requested services.
* `assignments` shows the staff member and exact local times for each segment of the chain.

---

## curl example

```bash
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dateIso": "2025-09-17",
    "locationId": "00000000-0000-0000-0000-000000000000",
    "services": [
      { "serviceId": "11111111-1111-1111-1111-111111111111", "order": 0 },
      { "serviceId": "22222222-2222-2222-2222-222222222222", "order": 1 }
    ]
  }' \
  "$SUPABASE_URL/functions/v1/compute-timeslots"
```

---

## Behaviour & rules

* **Location settings respected**
  * `timezone`
  * `slotDurationMinutes`
  * `customerBookingLeadMinutes`
  * `customerBookingMaxMonthsAhead`
  * `timeSlotStrategy` (`REGULAR`, `REDUCE_GAPS`, `ELIMINATE_GAPS`)

* **Staff availability**  
  Determined by:
  1. Base `User.operatingHours` (now stored as arrays of working intervals per weekday)
  2. Overridden by any matching `StaffScheduleOverride.dateRange` `operatingHours`
  3. Minus intervals from `StaffUnavailability.dateRange` (and optional times)
  4. Minus overlaps with `BookingServiceAssignment` records.

* **Sequential multi-service bookings**
  * Each service in the chain must fit completely inside a staff’s free interval.
  * When no service is pinned to a specific staff and there are multiple services,
    the algorithm first tries to place the **entire chain with one staff member**;
    if that fails it falls back to chaining across multiple staff.

* **Time-slot strategies**
  * **REGULAR** – every aligned slot that fits.
  * **REDUCE_GAPS** – avoids creating small, hard-to-fill gaps.
  * **ELIMINATE_GAPS** – prefers slots that abut existing booked blocks.

---

## Performance

* Uses ETag + short in-memory TTL caching; cache key includes `dateIso`, `locationId`, and the ordered list of requested services.
* Database migrations include GiST indexes for overlap queries and generated range columns for efficient availability checks.

---

✅ **Breaking change notice:**  
Older clients that sent `mode` or `staffIds` must be updated—these fields are now ignored and should be removed.