# create-booking

HTTP POST function that creates a new booking from a timeslot selection, handling timezone conversions, database transactions, and **preventing double bookings**.

## Request

`POST /functions/v1/create-booking`

```json
{
  "locationId": "3909680c-6ee8-4b22-86f6-b68a54477042",
  "customer": {
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "notes": "Regular customer, prefers morning appointments",
    "tags": ["regular", "morning-preferred"]
  },
  "services": [
    {
      "id": "6c2f03da-c978-4774-813c-6d13f27d6f9d",
      "staff": {
        "id": "fc66d33c-a33c-4b20-9f16-85d603b42ec2"
      }
    }
  ],
  "date": "2025-09-24",
  "slot": {
    "startLocal": "09:00",
    "endLocal": "10:00",
    "timeZone": "Europe/Rome",
    "assignments": [
      {
        "serviceId": "6c2f03da-c978-4774-813c-6d13f27d6f9d",
        "staffId": "fc66d33c-a33c-4b20-9f16-85d603b42ec2",
        "startLocal": "09:00",
        "endLocal": "10:00"
      }
    ]
  }
}
```

### Parameters

| Field | Type | Required | Description |
|------|------|---------|-------------|
| `locationId` | UUID | ✓ | Target location |
| `customer.customerId` | UUID | ✓ | Customer ID |
| `customer.notes` | string | ✗ | Customer notes |
| `customer.tags` | array | ✗ | Customer tags |
| `services` | array | ✓ | Array of services with staff assignments |
| `services[].id` | UUID | ✓ | LocationService ID |
| `services[].staff.id` | UUID | ✓ | Staff member ID |
| `date` | string | ✓ | Date in YYYY-MM-DD format |
| `slot.startLocal` | string | ✓ | Start time in HH:MM format |
| `slot.endLocal` | string | ✓ | End time in HH:MM format |
| `slot.timeZone` | string | ✓ | IANA timezone (e.g., "Europe/Rome") |
| `slot.assignments` | array | ✓ | Service assignments with times |

## Response

### Success (201)
```json
{
  "success": true,
  "data": {
    "bookingId": "uuid-of-created-booking",
    "status": "AWAITING_PAYMENT",
    "startTime": "2025-09-24T07:00:00.000Z",
    "endTime": "2025-09-24T08:00:00.000Z",
    "totalAmount": 8500,
    "currency": "USD"
  }
}
```

### Conflict Error (409)
```json
{
  "error": "Time slot is no longer available",
  "code": "SLOT_CONFLICT",
  "details": {
    "message": "Another booking has been made for this time slot",
    "conflictingBooking": {
      "id": "conflicting-booking-id",
      "startTime": "2025-09-24T07:00:00.000Z",
      "endTime": "2025-09-24T08:00:00.000Z"
    }
  }
}
```

### Staff Conflict Error (409)
```json
{
  "error": "Staff member is no longer available",
  "code": "STAFF_CONFLICT",
  "details": {
    "message": "The selected staff member has another booking during this time",
    "conflictingAssignment": {
      "id": "conflicting-assignment-id",
      "employeeId": "staff-id",
      "startTime": "2025-09-24T07:00:00.000Z",
      "endTime": "2025-09-24T08:00:00.000Z"
    }
  }
}
```

### Other Errors (400/404/500)
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## curl example

```bash
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "3909680c-6ee8-4b22-86f6-b68a54477042",
    "customer": {
      "customerId": "550e8400-e29b-41d4-a716-446655440001",
      "notes": "Regular customer"
    },
    "services": [
      {
        "id": "6c2f03da-c978-4774-813c-6d13f27d6f9d",
        "staff": {
          "id": "fc66d33c-a33c-4b20-9f16-85d603b42ec2"
        }
      }
    ],
    "date": "2025-09-24",
    "slot": {
      "startLocal": "09:00",
      "endLocal": "10:00",
      "timeZone": "Europe/Rome",
      "assignments": [
        {
          "serviceId": "6c2f03da-c978-4774-813c-6d13f27d6f9d",
          "staffId": "fc66d33c-a33c-4b20-9f16-85d603b42ec2",
          "startLocal": "09:00",
          "endLocal": "10:00"
        }
      ]
    }
  }' \
  "$SUPABASE_URL/functions/v1/create-booking"
```

## Double Booking Prevention

The function implements **multiple layers** of protection against double bookings:

### 1. Database-Level Constraints
- **Location-level exclusion constraint**: Prevents overlapping bookings at the same location
- **Staff-level exclusion constraint**: Prevents overlapping service assignments for the same staff member
- These constraints are enforced at the PostgreSQL level, making them impossible to bypass

### 2. Pre-Check Validation
- **Booking conflict check**: Queries existing bookings before creating new ones
- **Staff conflict check**: Verifies staff availability before creating assignments
- Returns clear error messages with conflict details

### 3. Retry Logic with Race Condition Handling
- **Automatic retries**: If a constraint violation occurs, the function retries up to 3 times
- **Exponential backoff**: Waits progressively longer between retries
- **Graceful degradation**: Returns user-friendly error messages for conflicts

### 4. Transaction Safety
- **Atomic operations**: Booking and assignments are created together or not at all
- **Rollback on failure**: If assignments fail, the booking is automatically deleted
- **Consistent state**: Database is never left in a partially-created state

## Behavior & rules

* **Timezone conversion**: Automatically converts local times to UTC using the location's timezone
* **Database transaction**: Creates booking and service assignments atomically
* **Conflict prevention**: Multiple layers prevent double bookings and staff conflicts
* **Rollback on error**: If service assignments fail, the booking is automatically deleted
* **Customer relationship**: Updates or creates LocationCustomer relationship
* **Price calculation**: Sums up all service prices for total amount
* **Status**: New bookings start with "AWAITING_PAYMENT" status

## Database operations

1. **Conflict checks**: Queries for existing bookings and staff assignments
2. **Creates a `Booking` record** with UTC timestamps
3. **Creates `BookingServiceAssignment` records** for each service
4. **Updates/creates `LocationCustomer` relationship**
5. **All operations are wrapped in a transaction** for data consistency

## Error Handling

The function handles these specific conflict scenarios:

- **SLOT_CONFLICT**: Another booking exists for the same time slot at the location
- **STAFF_CONFLICT**: The selected staff member has another assignment during this time
- **RACE_CONDITION**: Multiple users trying to book the same slot simultaneously

Each error includes detailed information to help users understand what happened and potentially retry with different parameters.
