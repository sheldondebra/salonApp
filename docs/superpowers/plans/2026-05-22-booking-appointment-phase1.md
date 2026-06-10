# Booking & Appointment Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship salon operations calendar (web day view + mobile agenda) backed by an availability engine that respects working hours, breaks, approved time off, buffers, and service assignments.

**Architecture:** Extend `BookingAvailabilityService` for slot logic; add `ScheduleService` for calendar events; new `staff_breaks` and `staff_time_off_requests` tables; web/mobile consume unified APIs.

**Tech Stack:** Laravel 11 (PHP), PostgreSQL, Next.js 14 (React), Expo/React Native mobile, existing Spatie permissions.

**Spec:** `docs/superpowers/specs/2026-05-22-booking-appointment-phase1-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `backend-laravel/database/migrations/2026_06_01_*_create_staff_breaks_table.php` | Breaks schema |
| `backend-laravel/database/migrations/2026_06_01_*_create_staff_time_off_requests_table.php` | Time off schema |
| `backend-laravel/app/Models/StaffBreak.php` | Break model |
| `backend-laravel/app/Models/StaffTimeOffRequest.php` | Time off model |
| `backend-laravel/app/Services/StaffBreakService.php` | Break queries + validation |
| `backend-laravel/app/Services/StaffTimeOffService.php` | Time off queries + conflict check |
| `backend-laravel/app/Services/BookingAvailabilityService.php` | Extended slot logic |
| `backend-laravel/app/Services/ScheduleService.php` | Calendar events aggregation |
| `backend-laravel/app/Http/Controllers/Api/V1/ScheduleController.php` | Schedule events endpoint |
| `backend-laravel/app/Http/Controllers/Api/V1/StaffBreakController.php` | Break CRUD |
| `backend-laravel/app/Http/Controllers/Api/V1/StaffTimeOffController.php` | Time off CRUD |
| `backend-laravel/app/Http/Resources/ScheduleEventResource.php` | Event JSON shape |
| `backend-laravel/tests/Feature/BookingAvailabilityTest.php` | Availability tests |
| `backend-laravel/tests/Feature/ScheduleEventsTest.php` | Schedule API tests |
| `frontend-nextjs/src/features/schedule/schedule-day-view.tsx` | Web calendar grid |
| `frontend-nextjs/src/features/schedule/schedule-event-block.tsx` | Event rendering |
| `frontend-nextjs/src/features/schedule/use-schedule-events.ts` | Fetch + cache hook |
| `frontend-nextjs/src/features/schedule/appointment-detail-drawer.tsx` | Detail + actions |
| `frontend-nextjs/src/features/staff/staff-breaks-tab.tsx` | Breaks management |
| `frontend-nextjs/src/features/staff/staff-time-off-tab.tsx` | Time off management |
| `frontend-nextjs/src/features/appointments/appointments-view.tsx` | List \| Calendar toggle |
| `salonmobileapp/src/features/schedule/WorkplaceScheduleScreen.tsx` | Mobile agenda/tablet |
| `salonmobileapp/src/schedule/api.ts` | Mobile schedule client |

---

## P1-A — Availability Engine Foundation

### Task 1: Staff breaks migration and model

**Files:**
- Create: `backend-laravel/database/migrations/2026_06_01_100000_create_staff_breaks_table.php`
- Create: `backend-laravel/app/Models/StaffBreak.php`
- Modify: `backend-laravel/app/Models/StaffMember.php` (add `breaks()` relation)

- [ ] **Step 1: Create migration**

```php
Schema::create('staff_breaks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
    $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
    $table->string('title');
    $table->string('break_type', 32)->default('lunch');
    $table->unsignedTinyInteger('day_of_week')->nullable(); // 1-7 ISO
    $table->time('start_time');
    $table->time('end_time');
    $table->boolean('repeats_weekly')->default(true);
    $table->date('date')->nullable();
    $table->text('note')->nullable();
    $table->timestamps();
    $table->index(['tenant_id', 'staff_member_id', 'day_of_week']);
});
```

- [ ] **Step 2: Create model with tenant scope**

```php
class StaffBreak extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'staff_member_id', 'location_id', 'title', 'break_type',
        'day_of_week', 'start_time', 'end_time', 'repeats_weekly', 'date', 'note',
    ];

    protected function casts(): array
    {
        return [
            'repeats_weekly' => 'boolean',
            'date' => 'date',
        ];
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }
}
```

- [ ] **Step 3: Run migration**

Run: `cd backend-laravel && php artisan migrate --force`  
Expected: migrations run successfully

---

### Task 2: Staff time off migration and model

**Files:**
- Create: `backend-laravel/database/migrations/2026_06_01_100001_create_staff_time_off_requests_table.php`
- Create: `backend-laravel/app/Models/StaffTimeOffRequest.php`
- Modify: `backend-laravel/app/Models/StaffMember.php` (add `timeOffRequests()` relation)

- [ ] **Step 1: Create migration**

```php
Schema::create('staff_time_off_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
    $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
    $table->string('purpose', 64)->default('other');
    $table->string('custom_purpose')->nullable();
    $table->dateTime('start_at');
    $table->dateTime('end_at');
    $table->boolean('all_day')->default(false);
    $table->text('note')->nullable();
    $table->string('status', 32)->default('pending');
    $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('reviewed_at')->nullable();
    $table->text('review_note')->nullable();
    $table->timestamps();
    $table->index(['tenant_id', 'staff_member_id', 'status']);
});
```

- [ ] **Step 2: Create model**

```php
class StaffTimeOffRequest extends Model
{
    use BelongsToTenant;

    public const STATUS_APPROVED = 'approved';
    public const STATUS_PENDING = 'pending';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'tenant_id', 'staff_member_id', 'location_id', 'purpose', 'custom_purpose',
        'start_at', 'end_at', 'all_day', 'note', 'status',
        'requested_by_user_id', 'reviewed_by_user_id', 'reviewed_at', 'review_note',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'all_day' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }
}
```

- [ ] **Step 3: Run migration**

Run: `cd backend-laravel && php artisan migrate --force`

---

### Task 3: StaffBreakService — breaks for a day

**Files:**
- Create: `backend-laravel/app/Services/StaffBreakService.php`

- [ ] **Step 1: Implement `breaksForStaffOnDay`**

```php
public function breaksForStaffOnDay(int $staffMemberId, Carbon $day, ?int $locationId = null): Collection
{
    $dow = $day->dayOfWeekIso;

    return StaffBreak::query()
        ->where('staff_member_id', $staffMemberId)
        ->where(function ($q) use ($day, $dow) {
            $q->where(function ($q2) use ($dow) {
                $q2->where('repeats_weekly', true)->where('day_of_week', $dow);
            })->orWhere(function ($q2) use ($day) {
                $q2->where('repeats_weekly', false)->whereDate('date', $day);
            });
        })
        ->when($locationId, fn ($q) => $q->where(fn ($q2) => $q2
            ->whereNull('location_id')->orWhere('location_id', $locationId)))
        ->get()
        ->map(fn (StaffBreak $b) => [
            'start' => $this->parseTimeOnDay($day, $b->start_time),
            'end' => $this->parseTimeOnDay($day, $b->end_time),
            'reason' => 'break',
        ]);
}
```

- [ ] **Step 2: Add overlap validation helper for CRUD**

```php
public function assertNoOverlap(int $staffId, Carbon $start, Carbon $end, ?int $excludeId = null): void
{
    // throw ValidationException if overlaps existing break for same staff/day
}
```

---

### Task 4: StaffTimeOffService — approved blocks

**Files:**
- Create: `backend-laravel/app/Services/StaffTimeOffService.php`

- [ ] **Step 1: Implement `approvedBlocksForRange`**

```php
public function approvedBlocksForRange(
    int $staffMemberId,
    Carbon $from,
    Carbon $to,
    ?int $locationId = null,
): Collection {
    return StaffTimeOffRequest::query()
        ->where('staff_member_id', $staffMemberId)
        ->where('status', StaffTimeOffRequest::STATUS_APPROVED)
        ->where('start_at', '<', $to)
        ->where('end_at', '>', $from)
        ->when($locationId, fn ($q) => $q->where(fn ($q2) => $q2
            ->whereNull('location_id')->orWhere('location_id', $locationId)))
        ->get()
        ->map(fn ($r) => [
            'start' => $r->start_at,
            'end' => $r->end_at,
            'reason' => 'time_off',
        ]);
}
```

- [ ] **Step 2: `createApprovedBlock` for admin (status=approved immediately)**

---

### Task 5: Upgrade BookingAvailabilityService

**Files:**
- Modify: `backend-laravel/app/Services/BookingAvailabilityService.php`
- Modify: `backend-laravel/config/booking.php` (add `buffer_minutes` default)

- [ ] **Step 1: Inject StaffBreakService, StaffTimeOffService, StaffServiceAssignmentService**

- [ ] **Step 2: Extend `busyRanges` to merge appointments + breaks + approved time off**

Apply buffer: extend each appointment `end` by `TenantContext::get()?->setting('booking_buffer_minutes', config('booking.buffer_minutes', 0))` minutes when checking overlap.

- [ ] **Step 3: Add optional `reason` to slot output when unavailable**

When slot fails, set first matching reason: `booked`, `break`, `time_off`, `outside_hours`, `buffer`.

- [ ] **Step 4: When `staff_member_id` null, filter staff list by service assignment before generating slots** (keep existing "any staff" behavior if no staff filter — document: return union of all eligible staff slots)

- [ ] **Step 5: Update BookingAvailabilityController** to pass through `reason` in JSON when `include_reasons=1`

---

### Task 6: Availability feature tests

**Files:**
- Create: `backend-laravel/tests/Feature/BookingAvailabilityUpgradeTest.php`

- [ ] **Step 1: Test break blocks slot**

```php
public function test_break_blocks_availability_slot(): void
{
    // seed staff, service, recurring lunch break 12:00-13:00
    // GET availability for date → 12:00 slot available=false, reason=break
}
```

- [ ] **Step 2: Test approved time off blocks slot**

- [ ] **Step 3: Test buffer minutes block slot after appointment**

Run: `cd backend-laravel && php artisan test --filter=BookingAvailabilityUpgradeTest`

---

## P1-B — Schedule API + Break/Time Off CRUD

### Task 7: ScheduleService

**Files:**
- Create: `backend-laravel/app/Services/ScheduleService.php`
- Create: `backend-laravel/app/Http/Resources/ScheduleEventResource.php`

- [ ] **Step 1: Implement `eventsForRange($from, $to, $staffIds, $locationId)`**

Return collection of normalized events:
- Appointments (load client, service, staff color)
- Breaks (expand recurring for each day in range)
- Approved time off

Each event: `id`, `type`, `starts_at`, `ends_at`, `staff_member_id`, `location_id`, `title`, `status?`, `color?`, `meta`

- [ ] **Step 2: Create ScheduleEventResource**

---

### Task 8: ScheduleController + routes

**Files:**
- Create: `backend-laravel/app/Http/Controllers/Api/V1/ScheduleController.php`
- Modify: `backend-laravel/routes/api/v1.php`

- [ ] **Step 1: Add route inside tenant auth group**

```php
Route::get('/schedule/events', [ScheduleController::class, 'index']);
```

- [ ] **Step 2: Validate query params; authorize `bookings.view`**

- [ ] **Step 3: Feature test ScheduleEventsTest** — returns appointment + break + time_off for single day

Run: `php artisan test --filter=ScheduleEventsTest`

---

### Task 9: Staff break CRUD

**Files:**
- Create: `backend-laravel/app/Http/Controllers/Api/V1/StaffBreakController.php`
- Create: `backend-laravel/app/Http/Requests/Staff/StoreStaffBreakRequest.php`
- Modify: `backend-laravel/routes/api/v1.php` (under staff-members)

- [ ] **Step 1: Routes**

```php
Route::get('/staff-members/{staffMember}/breaks', [StaffBreakController::class, 'index']);
Route::post('/staff-members/{staffMember}/breaks', [StaffBreakController::class, 'store']);
Route::patch('/staff-members/{staffMember}/breaks/{staffBreak}', [StaffBreakController::class, 'update']);
Route::delete('/staff-members/{staffMember}/breaks/{staffBreak}', [StaffBreakController::class, 'destroy']);
```

- [ ] **Step 2: Implement controller using StaffBreakService**

- [ ] **Step 3: Feature test break CRUD**

---

### Task 10: Staff time off CRUD (admin)

**Files:**
- Create: `backend-laravel/app/Http/Controllers/Api/V1/StaffTimeOffController.php`
- Modify: `backend-laravel/routes/api/v1.php`

- [ ] **Step 1: Routes for list/create/patch/cancel**

- [ ] **Step 2: Admin create sets `status=approved`, `reviewed_at=now`**

- [ ] **Step 3: Validate conflict with existing appointments → 422 with count**

---

## P1-C — Web Schedule UI

### Task 11: Schedule data hook + types

**Files:**
- Modify: `frontend-nextjs/src/lib/api/types.ts` (ScheduleEvent type)
- Create: `frontend-nextjs/src/features/schedule/use-schedule-events.ts`
- Create: `frontend-nextjs/src/lib/api/schedule-cache.ts` (sessionStorage, 60s TTL — same pattern as staff-meta-cache)

- [ ] **Step 1: Add types**

```typescript
export type ScheduleEventType = 'appointment' | 'break' | 'time_off' | 'unavailable';

export type ScheduleEvent = {
  id: string;
  type: ScheduleEventType;
  starts_at: string;
  ends_at: string;
  staff_member_id: number;
  location_id?: number | null;
  title: string;
  status?: string;
  color?: string | null;
  meta?: Record<string, unknown>;
};
```

- [ ] **Step 2: Hook fetches `GET /{slug}/schedule/events` with from/to; hydrates from cache first**

---

### Task 12: Schedule day view component

**Files:**
- Create: `frontend-nextjs/src/features/schedule/schedule-day-view.tsx`
- Create: `frontend-nextjs/src/features/schedule/schedule-event-block.tsx`
- Create: `frontend-nextjs/src/features/schedule/schedule-toolbar.tsx`

- [ ] **Step 1: Toolbar** — date picker, Today, staff multi-select, branch select

- [ ] **Step 2: Grid** — CSS grid; time labels left; one column per staff; position events by `starts_at`/`ends_at` relative to day open/close

- [ ] **Step 3: Event blocks** — appointment uses staff color; break hatched; time_off amber; status badge on appointments

- [ ] **Step 4: Click empty slot** — callback `(staffId, startsAt) => open booking panel`

- [ ] **Step 5: Click event** — callback `(event) => open detail drawer`

---

### Task 13: Appointment detail drawer

**Files:**
- Create: `frontend-nextjs/src/features/schedule/appointment-detail-drawer.tsx`

- [ ] **Step 1: Sheet/drawer showing client, service, staff, time, status, payment, notes**

- [ ] **Step 2: Actions** — Confirm, Complete, Cancel (reuse status patch from `appointments-view.tsx`), Reschedule (open `AppointmentReschedulePanel`)

- [ ] **Step 3: Wire refresh after action**

---

### Task 14: Appointments page — List | Calendar toggle

**Files:**
- Modify: `frontend-nextjs/src/features/appointments/appointments-view.tsx`

- [ ] **Step 1: Add `viewMode: 'list' | 'calendar'` state with tab toggle**

- [ ] **Step 2: Render `ScheduleDayView` when calendar mode**

- [ ] **Step 3: Pass `StaffBookingPanel` open handler from slot click**

- [ ] **Step 4: Add nav link label unchanged (`Appointments`) — calendar is sub-view**

---

### Task 15: Staff profile — Breaks + Time off tabs

**Files:**
- Create: `frontend-nextjs/src/features/staff/staff-breaks-tab.tsx`
- Create: `frontend-nextjs/src/features/staff/staff-time-off-tab.tsx`
- Modify: `frontend-nextjs/src/features/staff/staff-team-view.tsx` (add tabs to profile drawer)

- [ ] **Step 1: Breaks tab** — list, add/edit modal (title, type, day/time or one-time date, recurring toggle)

- [ ] **Step 2: Time off tab** — list approved blocks, add form (purpose, start/end, all-day)

- [ ] **Step 3: Invalidate schedule cache on save**

---

### Task 16: Wire booking flows to upgraded availability

**Files:**
- Modify: `frontend-nextjs/src/features/booking/load-availability-slots.ts`
- Modify: `frontend-nextjs/src/features/appointments/staff-booking-panel.tsx`
- Modify: `frontend-nextjs/src/features/appointments/appointment-reschedule-panel.tsx`

- [ ] **Step 1: No API URL change — verify slots still load; optionally show unavailable reason in admin slot picker (muted slots with tooltip)**

- [ ] **Step 2: Manual test** — book during break → error toast

---

## P1-D — Mobile Schedule

### Task 17: Mobile schedule API client

**Files:**
- Create: `salonmobileapp/src/schedule/api.ts`
- Create: `salonmobileapp/src/schedule/types.ts`
- Create: `salonmobileapp/src/schedule/cache.ts`

- [ ] **Step 1: `fetchScheduleEvents(auth, { from, to, staffIds?, locationId? })`**

- [ ] **Step 2: In-memory cache 60s TTL (mirror staff cache pattern)**

---

### Task 18: WorkplaceScheduleScreen

**Files:**
- Create: `salonmobileapp/src/features/schedule/WorkplaceScheduleScreen.tsx`
- Modify: `salonmobileapp/src/app/workplace/bookings.tsx` (add Schedule tab or replace with tab toggle List | Day)

- [ ] **Step 1: Phone — day agenda grouped by staff, date swipe, staff filter**

- [ ] **Step 2: Tablet (`useSplitLayout`) — staff columns day grid simplified from web**

- [ ] **Step 3: Tap appointment → existing booking detail route `/workplace/bookings/[uuid]`**

- [ ] **Step 4: Add to WorkplaceTabBar or bookings screen header toggle**

---

### Task 19: Mobile booking uses same availability

**Files:**
- Modify: `salonmobileapp/src/booking/api.ts` (no URL change)
- Modify: `salonmobileapp/src/features/booking/BookingWizard.tsx`

- [ ] **Step 1: Verify slot fetch unchanged; manual test break blocks slot**

---

## Final Verification

- [ ] **Backend:** `cd backend-laravel && php artisan test`

- [ ] **Web:** `cd frontend-nextjs && npm run lint && npm run build`

- [ ] **Mobile:** `cd salonmobileapp && npm run lint`

- [ ] **Manual checklist (spec acceptance criteria):**
  - Day schedule shows appointments + breaks + time off
  - Staff panel booking rejects break overlap
  - Public wizard shows reduced slots after break added
  - Mobile agenda matches web for same day

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-22-booking-appointment-phase1.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach do you want?
