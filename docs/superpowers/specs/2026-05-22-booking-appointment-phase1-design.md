# Booking & Appointment Engine — Phase 1 Design

**Status:** Approved  
**Date:** 2026-05-22  
**Scope:** Operations workspace + availability engine (Phase 1 of phased upgrade D)  
**Out of scope (Phase 2+):** Public booking wizard polish, drag-and-drop reschedule, recurring/group UI, full time-off approval workflow UI

---

## Goal

Give salon staff an accurate **day schedule calendar** (web + mobile) backed by an upgraded **availability engine** that respects working hours, breaks, approved time off, service assignments, existing bookings, and buffer time. Public and staff booking flows must use the same slot logic.

---

## Current State

| Area | Exists today |
|------|----------------|
| Backend | `BookingService`, `BookingAvailabilityService` (staff working hours + tenant opening hours + appointment overlap), waitlist, group/recurring booking in service layer |
| Availability API | `GET /booking/availability` and tenant-scoped equivalent; returns `{ time, label, available }` per day |
| Web workplace | List-based `AppointmentsView`; `StaffBookingPanel`; `AppointmentReschedulePanel` |
| Web public | Multi-step `BookingWizard` |
| Mobile | Client `BookingWizard`; workplace bookings list |
| Missing | `staff_breaks`, `staff_time_off_requests`, schedule events API, calendar UI, buffer time, slot unavailable reasons |

---

## Architecture

### Approach: Vertical slices (P1-A → P1-D)

Each slice ships testable backend + consumer. `BookingAvailabilityService` is **extended in place** (not replaced wholesale) to avoid breaking existing booking/reschedule paths; new schedule-specific logic lives in `ScheduleService`.

```
┌─────────────────────────────────────────────────────────────┐
│  Web Schedule View / Mobile Agenda                          │
│  StaffBookingPanel / BookingWizard / ReschedulePanel        │
└──────────────────────────┬──────────────────────────────────┘
                           │
         GET /schedule/events          GET /availability
                           │
┌──────────────────────────┴──────────────────────────────────┐
│  ScheduleService              BookingAvailabilityService     │
│  (events for calendar)        (slots for booking)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
     StaffWorkingHoursService · StaffBreakService · StaffTimeOffService
     StaffServiceAssignmentService · Appointment queries
                           │
                    PostgreSQL (tenant-scoped)
```

### Tenant settings (new)

Stored in existing tenant settings JSON:

- `booking_buffer_minutes` — default `0`, applied after each appointment end when checking slot overlap
- Reuse existing `opening_hours` for salon-wide hours when staff has no custom schedule

---

## Data Model

### `staff_breaks`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| tenant_id | FK | |
| staff_member_id | FK | |
| location_id | FK nullable | branch scope |
| title | string | e.g. "Lunch" |
| break_type | enum | lunch, short_break, meeting, personal, training, other |
| day_of_week | tinyint nullable | 1–7 ISO; null if one-time |
| start_time | time | H:i |
| end_time | time | H:i |
| repeats_weekly | boolean | default true |
| date | date nullable | one-time break on specific date |
| note | text nullable | |
| timestamps | | |

### `staff_time_off_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| tenant_id | FK | |
| staff_member_id | FK | |
| location_id | FK nullable | |
| purpose | string | vacation, sick_leave, personal, training, other |
| custom_purpose | string nullable | |
| start_at | datetime | |
| end_at | datetime | |
| all_day | boolean | default false |
| note | text nullable | |
| status | enum | pending, approved, rejected, cancelled |
| requested_by_user_id | FK nullable | |
| reviewed_by_user_id | FK nullable | |
| reviewed_at | timestamp nullable | |
| review_note | text nullable | |
| timestamps | | |

**Phase 1 rule:** Only `approved` time off blocks availability and appears on calendar.

---

## API Design

### Availability (upgrade existing)

`GET /api/v1/{tenantSlug}/availability`  
`GET /api/v1/booking/{tenantSlug}/availability` (public)

**Query:** unchanged + optional `include_reasons=1` for admin tools

**Response slot shape (extended):**

```json
{
  "time": "10:00",
  "label": "10:00 AM",
  "available": false,
  "reason": "break"
}
```

**Reason values:** `booked`, `break`, `time_off`, `outside_hours`, `buffer`, `staff_unavailable`

**Engine rules (all must pass for `available: true`):**

1. Slot within staff working hours (or tenant opening hours fallback)
2. Staff active, bookable, assigned to all requested services (when staff specified)
3. No overlap with existing non-cancelled appointments (+ buffer after each)
4. No overlap with staff breaks (recurring or one-time for date)
5. No overlap with approved time off
6. Entire service duration fits before close time

### Schedule events (new)

`GET /api/v1/{tenantSlug}/schedule/events`

**Query:**

| Param | Required | Description |
|-------|----------|-------------|
| from | yes | ISO date or datetime |
| to | yes | ISO date or datetime |
| staff_ids | no | comma-separated IDs |
| location_id | no | branch filter |

**Response:**

```json
{
  "data": [
    {
      "id": "apt_42",
      "type": "appointment",
      "starts_at": "2026-05-22T10:00:00Z",
      "ends_at": "2026-05-22T11:00:00Z",
      "staff_member_id": 3,
      "location_id": 1,
      "title": "Haircut — Jane Doe",
      "status": "confirmed",
      "color": "#E879A6",
      "meta": { "appointment_uuid": "...", "client_name": "Jane Doe", "service_name": "Haircut" }
    },
    {
      "id": "break_7",
      "type": "break",
      "starts_at": "...",
      "ends_at": "...",
      "staff_member_id": 3,
      "title": "Lunch",
      "meta": { "break_type": "lunch" }
    },
    {
      "id": "timeoff_2",
      "type": "time_off",
      "starts_at": "...",
      "ends_at": "...",
      "staff_member_id": 3,
      "title": "Vacation",
      "meta": { "status": "approved" }
    }
  ],
  "meta": { "from": "...", "to": "...", "staff_count": 3 }
}
```

**Permissions:** `bookings.view`

### Staff breaks CRUD (new)

Under existing staff member routes:

- `GET /staff-members/{id}/breaks`
- `POST /staff-members/{id}/breaks`
- `PATCH /staff-members/{id}/breaks/{breakId}`
- `DELETE /staff-members/{id}/breaks/{breakId}`

**Permissions:** `staff.view` / `staff.update`

### Staff time off (Phase 1 minimal)

- `GET /staff-members/{id}/time-off`
- `POST /staff-members/{id}/time-off` — admin creates approved block directly
- `PATCH /staff-members/{id}/time-off/{id}` — cancel / edit
- `GET /time-off-requests?status=pending` — optional list for later; Phase 1 can return empty until Batch 75 UI

**Permissions:** `staff.view` / `staff.update`

---

## Web UI

### Appointments page upgrade

Route: `/{tenantSlug}/appointments` (existing)

Add **view toggle:** List | Calendar

### Calendar (day view — Phase 1C)

- Time column: tenant opening hours (or 08:00–20:00 fallback)
- Staff columns: bookable active staff (filterable)
- Branch filter
- Today button + date picker
- Event blocks: appointments (color = staff `color_code`), breaks (hatched gray), time off (amber)
- Click empty slot → open `StaffBookingPanel` pre-filled with staff + datetime
- Click appointment → **detail drawer** (client, service, staff, status, payment, notes, actions: confirm, complete, cancel, reschedule)

### Staff profile tabs (Phase 1B)

- **Breaks** tab on staff profile (reuse tab pattern from Services/Hours)
- **Time off** tab — admin add approved block (simple form; full request workflow deferred)

### Booking panels

- `StaffBookingPanel` and `AppointmentReschedulePanel` use upgraded availability (no UI change required beyond optional unavailable reason tooltip)

---

## Mobile UI

### Workplace bookings (Phase 1D)

**Phone:** Day agenda grouped by staff; swipe/date nav; tap → detail screen  
**Tablet:** Staff-column day view (simplified web layout)

Reuse `GET /schedule/events` with same filters.

---

## Error Handling

- Reschedule/book when slot unavailable → 422 with message from availability engine
- Schedule query `from > to` → 422
- Break/time off overlap validation on create → 422 with field errors
- Time off that conflicts with existing appointments → 422 warning with affected appointment count (admin must resolve)

---

## Testing

### Backend (PHPUnit)

- Availability: slot blocked by break, time off, buffer, double booking
- Availability: staff without service assignment excluded
- Schedule events: returns appointments + breaks + approved time off for date range
- Break CRUD: recurring vs one-time

### Manual

- Web day view shows today's appointments
- Book through staff panel during break → rejected
- Public booking wizard shows fewer slots after break added
- Mobile agenda matches web for same day

---

## Phase 2 Preview (not in this spec)

- Public booking wizard UX polish
- Waitlist CTA when no slots
- Week view on web
- Full time-off request + approval queue
- Drag-and-drop reschedule

---

## Acceptance Criteria (Phase 1)

- [ ] Admin sees day schedule with staff columns, appointments, breaks, and approved time off
- [ ] Booking and reschedule reject invalid slots (breaks, time off, conflicts, buffer)
- [ ] Breaks manageable from staff profile
- [ ] Admin can add approved time off that blocks slots
- [ ] Web list view still works; calendar is additive
- [ ] Mobile phone agenda and tablet day view use same schedule API
- [ ] Public + staff booking use upgraded availability endpoint
