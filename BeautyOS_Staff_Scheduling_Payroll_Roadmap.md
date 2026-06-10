# BeautyOS Staff, Scheduling, Time Off & Payroll Roadmap

This roadmap builds a professional staff management module for BeautyOS.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, auth, role, booking, service, notification, dashboard, mobile, and UI patterns.

Important cross-platform rule:
Every feature must include:
1. Laravel backend API
2. Web frontend
3. Mobile phone UI
4. Mobile tablet UI

Mobile/tablet must support 60-80% of daily shop operations for businesses without laptops.

Design direction:
- Clean modern SaaS UI
- Premium baby-pink BeautyOS theme
- Shadcn UI on web
- React Native mobile UI
- Lucide icons or matching icon set
- Clean cards, tables, filters, empty states, loading states, charts, and status badges
- Do not create ugly admin-template screens

---

## Feature Goal

Build a complete Staff Operations Center where tenant admins can:

- Manage staff members
- Assign services to staff
- Set working days and hours
- Set breaks/lunch times
- View staff schedule calendar
- Manage staff availability
- Approve or reject staff time off requests
- Add admin-created time off
- Track staff payroll, commissions, tips, and payouts
- View staff analytics and availability insights

---

## Batch 71 - Staff Operations Foundation

Build the staff operations foundation.

Backend:
- Review existing staff model and improve if needed.
- Add staff profile fields: tenant_id, branch_id, user_id, display_name, job_title, email, phone, avatar, initials, bio, status, bookable, employment_type, hire_date, color_code.
- Add tenant-scoped APIs for list, create, update, deactivate/delete, and show staff.
- Add role permissions: view staff, create staff, update staff, delete staff, manage staff settings.

Web:
- Build Staff page.
- Add staff cards/list/table toggle.
- Add filters for status, branch, job title, and bookable.
- Add search.
- Add add/edit staff modal or page.
- Add status badges and bookable badges.
- Add clean employee profile drawer.

Mobile phone:
- Staff list screen.
- Staff profile screen.
- Add/edit staff for admins.
- Quick call/email actions.

Mobile tablet:
- Two-column staff layout.
- Staff list on left, profile/details on right.

Analytics cards:
- Total staff
- Active staff
- Bookable staff
- Staff on leave today
- Available now

Acceptance criteria:
- Tenant admin can manage staff cleanly.
- Staff records are tenant-scoped.
- UI is clean on web, phone, and tablet.

---

## Batch 72 - Staff Services Assignment

Allow admin to assign services to staff.

Backend:
- Create or update staff_services pivot table.
- Fields: staff_id, service_id, tenant_id, custom_duration_minutes, custom_price, is_active.
- APIs: get staff services, assign service, remove service, bulk assign, get staff who can perform a service.

Web:
- Staff profile > Services tab.
- Searchable multi-select for services.
- Show assigned services with category, duration, and price.
- Allow custom staff-specific duration or price.
- Add bulk assign UI.

Mobile phone:
- Staff services screen.
- Admin can assign/unassign services.
- Staff can view services they provide.

Mobile tablet:
- Split view: service categories left, selected staff services right.

Booking logic:
- Booking flow must only show staff who can perform selected service.
- Staff availability should respect assigned services.

Acceptance criteria:
- Staff can have multiple services.
- Services can have multiple staff.
- Booking uses staff-service assignment correctly.

---

## Batch 73 - Staff Working Hours

Build staff working hours.

Backend:
- Create staff_working_hours table.
- Fields: tenant_id, staff_id, branch_id, day_of_week, is_working_day, start_time, end_time, effective_from, effective_to.
- APIs: get working hours, update weekly working hours, copy schedule to other days, apply schedule to multiple staff.

Web:
- Staff profile > Working Hours tab.
- Weekly schedule editor.
- Day toggles.
- Start/end time selectors.
- Copy Monday to all weekdays.
- Apply schedule to multiple staff.
- Show schedule summary.

Mobile phone:
- Simple weekly working hours screen.
- Admin can update days and times.
- Staff can view own hours.

Mobile tablet:
- Weekly grid layout.

Validation:
- End time must be after start time.
- Prevent invalid overlapping hours.
- Respect branch timezone.

Acceptance criteria:
- Admin can set staff working days and hours.
- Staff availability uses working hours.

---

## Batch 74 - Staff Breaks & Lunch

Build staff breaks.

Backend:
- Create staff_breaks table.
- Fields: tenant_id, staff_id, branch_id, day_of_week, title, break_type, start_time, end_time, repeats_weekly, date, note.
- Break types: lunch, short_break, meeting, personal, training, other.
- APIs: list breaks, create break, update break, delete break.

Web:
- Staff profile > Breaks tab.
- Add break modal.
- Break type icons.
- Weekly recurring breaks.
- One-time break option.
- Display breaks on schedule calendar.

Mobile phone:
- Break list.
- Add/edit break.
- Staff can view breaks.

Mobile tablet:
- Calendar-style break layout.

Booking logic:
- Appointment slots must not overlap breaks.
- Calendar should show breaks/lunch as blocked time.

Acceptance criteria:
- Admin can add breaks/lunch.
- Bookings cannot be scheduled during breaks.
- Schedule calendar displays breaks clearly.

---

## Batch 75 - Staff Time Off Requests

Build staff time off requests.

Purpose suggestions:
- Vacation
- Sick leave
- Family emergency
- Personal leave
- Training
- Maternity/Paternity
- Bereavement
- Unpaid leave
- Other

Backend:
- Create staff_time_off_requests table.
- Fields: tenant_id, staff_id, branch_id, purpose, custom_purpose, start_at, end_at, all_day, note, status, requested_by_user_id, reviewed_by_user_id, reviewed_at, review_note.
- Statuses: pending, approved, rejected, cancelled.
- APIs: staff create request, admin create time off, admin approve, admin reject, cancel request, list requests, show request.

Web:
- Tenant dashboard > Staff > Time Off.
- Staff profile > Time Off tab.
- Pending approvals queue.
- Calendar view.
- Approve/reject actions.
- Admin-created time off.
- Notes and review comments.

Mobile phone:
- Staff can request time off.
- Admin can approve/reject from mobile.
- Simple status timeline.

Mobile tablet:
- Time off calendar plus request panel.

Booking logic:
- Approved time off blocks availability.
- Warn admin if time off conflicts with existing bookings.
- Show affected appointments.

Notifications:
- Notify admin when staff requests time off.
- Notify staff when approved/rejected.

Acceptance criteria:
- Staff can request time off.
- Admin can approve/reject.
- Approved time off blocks booking slots.

---

## Batch 76 - Staff Schedule Calendar

Build the staff schedule calendar similar to salon scheduling tools.

Backend:
- Create APIs for day view, week view, staff availability, bookings by staff, breaks, and time off.
- Return combined schedule events: appointment, break, time_off, unavailable.

Web:
- Build Schedule page.
- Day view and week view.
- Time column from opening to closing.
- Staff columns.
- Show appointment cards.
- Show lunch/break blocks.
- Show time off blocks.
- Show available/unavailable states.
- Today button.
- Date picker.
- Staff filter.
- Branch filter.

Mobile phone:
- Agenda view by staff.
- Day timeline.
- Swipe date navigation.
- Staff filter.
- Tap appointment for details.

Mobile tablet:
- Staff column calendar similar to web.
- Day/week toggle.

UI:
- Use staff initials/avatar.
- Use staff color codes.
- Clean status badges.
- Beautiful appointment cards.
- Smooth empty states.

Acceptance criteria:
- Admin can view staff schedule clearly.
- Breaks, time off, and bookings appear together.
- Phone and tablet views are useful for daily operations.

---

## Batch 77 - Availability Engine Upgrade

Upgrade availability logic to combine working hours, breaks, time off, services, and existing bookings.

Backend:
- Create AvailabilityService.
- Inputs: tenant, branch, services, staff optional, date range.
- Consider staff working hours, assigned services, breaks, approved time off, existing bookings, service duration, and buffer time.
- Return available time slots.

Rules:
- Do not show inactive staff.
- Do not show non-bookable staff.
- Do not show staff not assigned to service.
- Do not show slots during break/time off.
- Prevent double booking.

Web:
- Update booking flow to use upgraded availability.
- Show unavailable reasons in admin tools where useful.

Mobile:
- Update booking flow to use same API.

Acceptance criteria:
- Booking slots are accurate.
- Availability works consistently on web and mobile.

---

## Batch 78 - Payroll Foundation

Build payroll foundation.

Payroll should support:
- Fixed salary
- Hourly pay
- Commission
- Tips
- Bonuses
- Deductions
- Payout tracking

Backend:
- Create tables: payroll_profiles, payroll_periods, payroll_entries, payroll_adjustments, staff_payouts.
- Payroll profile fields: tenant_id, staff_id, pay_type, base_salary, hourly_rate, commission_rate, commission_type, tip_eligible, payout_method, payout_account_details, active.
- Payroll period fields: tenant_id, branch_id, start_date, end_date, status.
- Payroll entry fields: payroll_period_id, staff_id, gross_pay, commission_amount, tips_amount, bonuses, deductions, net_pay, status.

Web:
- Staff profile > Payroll tab.
- Payroll settings.
- Payroll periods list.
- Payroll summary cards.
- Staff earnings table.

Mobile phone:
- Staff can view earnings summary.
- Admin can view payroll overview.

Mobile tablet:
- Payroll dashboard with summary and table.

Acceptance criteria:
- Payroll profiles can be configured.
- Payroll periods and entries can be created.
- Staff earnings are visible.

---

## Batch 79 - Commission, Tips & Earnings Calculation

Build earnings calculation.

Backend:
- Calculate commissions from completed appointments.
- Support percent commission per staff, fixed commission per service, service-specific commission override, tips, bonuses, deductions.
- Only count completed/paid appointments where configured.
- Avoid double-counting.
- Add recalculation action for payroll period.

Web:
- Payroll period detail page.
- Earnings breakdown per staff.
- Commission source list.
- Appointment-based earnings details.
- Manual bonus/deduction adjustments.

Mobile:
- Staff earnings breakdown.
- Admin payroll review.

Charts:
- Payroll cost by period
- Top earning staff
- Commission trend
- Tips trend

Acceptance criteria:
- Earnings are calculated accurately.
- Admin can review how numbers were produced.
- Staff can see transparent earnings breakdown.

---

## Batch 80 - Payroll Approval & Payouts

Build payroll approval and payout workflow.

Backend:
- Approve payroll period.
- Mark staff payout as paid.
- Record payout reference.
- Record payment method.
- Lock approved/paid payroll entries from accidental edits.
- Add audit logs.

Statuses:
- draft
- pending_review
- approved
- paid
- cancelled

Web:
- Payroll approval screen.
- Payout checklist.
- Mark paid action.
- Export payroll.
- Download payroll summary.

Mobile phone:
- Admin can review and mark payout.
- Staff can see payout status.

Mobile tablet:
- Payroll approval split layout.

Acceptance criteria:
- Payroll can move from draft to paid.
- Paid records are auditable.
- Admin can export payroll.

---

## Batch 81 - Staff Analytics Dashboard

Build staff analytics.

Web dashboard:
- Total staff
- Active staff
- Bookable staff
- Available now
- Staff on leave today
- Staff utilization
- Revenue by staff
- Completed appointments by staff
- Cancellation/no-show by staff
- Top services by staff
- Payroll cost summary

Mobile phone:
- Staff operations summary.
- Available now list.
- On leave list.
- Today schedule summary.

Mobile tablet:
- Staff analytics dashboard with charts and tables.

Charts:
- Staff utilization
- Revenue by staff
- Appointments by staff
- Leave trend
- Payroll trend

Acceptance criteria:
- Admin can understand staff performance and availability.
- Staff data is tenant-scoped.
- Charts are clean and useful.

---

## Batch 82 - Staff Module Final Polish

Polish staff, scheduling, time off, breaks, and payroll.

Tasks:
- Improve UI consistency.
- Add missing empty states.
- Add loading skeletons.
- Add error states.
- Add confirmation dialogs.
- Add audit logs.
- Add permissions.
- Add tests for availability, time off blocking, break blocking, payroll calculations, and tenant isolation.
- Improve mobile phone UX.
- Improve mobile tablet UX.
- Update README/docs.

Acceptance criteria:
- Staff module is market-ready.
- Phone/tablet can handle daily staff operations.
- Admin can manage staff, schedules, time off, and payroll smoothly.
