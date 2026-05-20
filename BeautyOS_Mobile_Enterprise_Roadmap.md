# BeautyOS Mobile & Enterprise Roadmap

This file continues after BeautyOS_Next_Features_Roadmap.md.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing Laravel API, tenant logic, auth, roles, UI patterns, and database structure.

---

## Batch 36 — React Native Mobile App Foundation

Build the React Native mobile app foundation.

Mobile app users:
- Super Admin
- Tenant Owner
- Staff
- Client

Tasks:
- Create mobile app structure.
- Use Expo or React Native CLI based on existing preference.
- Set up TypeScript.
- Set up authentication screens.
- Set up API client.
- Set up secure token storage.
- Set up role-based navigation.
- Set up baby-pink premium mobile theme.
- Add reusable components:
  - Button
  - Input
  - Card
  - Header
  - EmptyState
  - LoadingState

Acceptance criteria:
- Mobile app can connect to existing SaaS API.
- Login structure exists.
- Navigation changes based on role.
- UI feels clean and professional.

---

## Batch 37 — Client Mobile App Booking Flow

Build the client booking flow for mobile.

Tasks:
- Browse tenant/business.
- View services.
- View staff.
- Select service.
- Select staff.
- Select date and time.
- Create booking.
- View booking confirmation.
- View booking history.
- Cancel or reschedule booking.

Acceptance criteria:
- Client can book from mobile.
- Booking data uses existing API.
- UI is simple and smooth.

---

## Batch 38 — Staff Mobile Portal

Build the staff mobile portal.

Tasks:
- Staff dashboard.
- Today’s appointments.
- Upcoming appointments.
- Appointment details.
- Update appointment status.
- View customer notes.
- Manage availability.
- View earnings or commission summary.

Acceptance criteria:
- Staff can manage their daily work from mobile.
- Staff only sees assigned tenant data.

---

## Batch 39 — Tenant Owner Mobile Dashboard

Build mobile dashboard for tenant owners.

Tasks:
- Revenue summary.
- Today’s bookings.
- Pending bookings.
- Staff performance summary.
- Customer count.
- Payment summary.
- Quick actions:
  - Add booking
  - Add customer
  - Add service
  - View reports

Acceptance criteria:
- Tenant owner can monitor business from mobile.
- Data remains tenant-scoped.

---

## Batch 40 — Super Admin Mobile Dashboard

Build mobile dashboard for Super Admin.

Tasks:
- Platform revenue summary.
- Active tenants.
- Trial tenants.
- Subscription overview.
- Failed payments.
- SMS usage.
- Tenant growth.
- Support ticket overview.

Acceptance criteria:
- Super Admin can monitor SaaS operations from mobile.
- Data is platform-wide and protected by role.

---

## Batch 41 — Push Notifications

Add push notification support.

Tasks:
- Add push notification tokens to backend.
- Register mobile device tokens.
- Send push notifications for:
  - New booking
  - Booking reminder
  - Payment success
  - Payment failed
  - Staff assignment
  - Subscription alert
- Add notification preferences.

Acceptance criteria:
- Mobile users can receive push notifications.
- Backend stores device tokens securely.

---

## Batch 42 — Offline-Ready Mobile Foundation

Prepare mobile app for low-connectivity environments.

Tasks:
- Cache key screens.
- Cache bookings.
- Cache services.
- Cache customers for staff/tenant users.
- Add offline banner.
- Add retry sync queue foundation.
- Prevent duplicate offline submissions.

Acceptance criteria:
- App remains usable with weak network.
- Offline limitations are clearly shown.

---

## Batch 43 — Enterprise Branch Management

Build advanced enterprise branch management.

Tasks:
- Regional branch grouping.
- Branch managers.
- Branch-level reports.
- Branch-specific services.
- Branch-specific staff.
- Branch-specific pricing.
- Branch-specific working hours.
- Branch comparison reports.

Acceptance criteria:
- Enterprise tenants can manage multiple branches cleanly.
- Reports can be filtered by region and branch.

---

## Batch 44 — Franchise Management

Build franchise support.

Tasks:
- Franchise owner role.
- Franchise locations.
- Franchise-level reports.
- Franchise branding control.
- Location-level permissions.
- Franchise billing model.
- Franchise performance comparison.

Acceptance criteria:
- Franchise businesses can manage many locations.
- Permissions remain clean and secure.

---

## Batch 45 — White Label Mobile App Preparation

Prepare for white-label mobile apps.

Tasks:
- Tenant-specific app branding config.
- App icon config placeholder.
- Splash screen config placeholder.
- Theme config per tenant.
- Custom app name per tenant.
- White-label billing flag.
- White-label feature access control.

Acceptance criteria:
- System can support tenant-branded mobile apps later.
- No tenant can access white-label features without permission.

---

## Batch 46 — Enterprise SLA & Support

Build enterprise support features.

Tasks:
- Priority support tickets.
- SLA status.
- Ticket priority.
- Ticket assignment.
- Internal notes.
- Tenant support history.
- Support dashboard.
- Enterprise onboarding checklist.

Acceptance criteria:
- Office/Admin team can manage enterprise support properly.

---

## Batch 47 — Advanced Security Controls

Build advanced security controls.

Tasks:
- Two-factor authentication.
- Login activity logs.
- Suspicious login detection foundation.
- IP allowlist for enterprise tenants.
- Session management.
- Password policy settings.
- API key rotation.

Acceptance criteria:
- Enterprise tenants have stronger security controls.
- Login activity is auditable.

---

## Batch 48 — Data Export & Backups

Build data export and backup tools.

Tasks:
- Export customers.
- Export bookings.
- Export payments.
- Export reports.
- Export inventory.
- Tenant data backup request.
- Super Admin backup overview.
- CSV and Excel export.

Acceptance criteria:
- Tenants can export their own data.
- Super Admin can manage export requests.

---

## Batch 49 — Enterprise API Access

Build enterprise API access.

Tasks:
- API key management.
- Scoped API permissions.
- Rate limiting.
- Webhook subscriptions.
- API usage logs.
- Developer documentation.
- Example API requests.

Acceptance criteria:
- Enterprise tenants can safely integrate external systems.

---

## Batch 50 — Mobile & Enterprise Final Polish

Final polish for mobile and enterprise features.

Tasks:
- Review UI consistency.
- Test role-based access.
- Test tenant isolation.
- Test mobile responsiveness.
- Test mobile API responses.
- Test branch and franchise permissions.
- Improve documentation.
- Remove dead code.
- Add missing empty/loading/error states.

Acceptance criteria:
- Mobile and enterprise features are market-ready.
- Code is clean, stable, and scalable.