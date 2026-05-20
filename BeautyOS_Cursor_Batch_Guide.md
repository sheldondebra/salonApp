# BeautyOS SaaS Platform — Cursor Batch Guide

Use this file as the single project reference in Cursor to save tokens.

When working in Cursor, say things like:

> Read `BeautyOS_Cursor_Batch_Guide.md` and execute Batch 1 only. Inspect the existing code first. Do not rebuild from scratch.

---

## 0. Product Summary

Build a premium multi-tenant SaaS booking platform for salons, spas, nail technicians, barbers, makeup artists, wellness businesses, and beauty professionals.

The product should help businesses:

- Accept online bookings
- Manage staff
- Manage customers
- Manage services
- Accept payments
- Send SMS/email notifications
- Manage coupons
- View reports and charts
- Brand their booking page
- Use default workspace URLs or custom domains/CNAME
- Connect booking widgets to WordPress websites
- Prepare APIs for a future React Native mobile app

This platform should feel like a polished, market-ready SaaS product, not a basic admin template.

---

## 1. Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI
- Lucide React icons
- Recharts
- Plus Jakarta Sans font
- Inter fallback

Backend:

- Laravel API
- Laravel Sanctum
- PostgreSQL or MySQL, depending on current project setup
- Queues for notifications, payments, reminders, and SMS
- REST API
- Clean service classes where needed

Future mobile:

- React Native app support through clean APIs

SMS:

- MNotify

Payments:

- Paystack
- Flutterwave

---

## 2. Brand & UI Direction

Brand personality:

- Premium
- Clean
- Modern
- Feminine luxury
- Professional SaaS
- Simple and smooth

Color system:

- Primary baby pink: `#F8BBD0`
- Soft background: `#FFF7FA`
- Rose accent: `#E879A6`
- Deep text: `#1F2937`
- Muted text: `#6B7280`
- Border: `#F3D6E3`
- White card: `#FFFFFF`

UI rules:

- Use clean spacing
- Use rounded `2xl` cards
- Use subtle shadows
- Use professional SaaS tables
- Use soft baby-pink accents only where needed
- Do not overuse pink
- Keep dashboards clean and readable
- Use searchable selects, comboboxes, filters, and dropdowns
- Do not make users type data that already exists in the system
- Add empty states
- Add loading skeletons
- Add toast notifications
- Add confirmation dialogs for destructive actions
- Make everything responsive
- Avoid ugly admin-template UI

Design references:

- Fresha
- Stripe Dashboard
- Linear
- Vercel
- Shopify Admin
- GlossGenius

---

## 3. Main Portals

Build these portals:

1. Public Marketing Website
2. Super Admin Portal
3. General Office / SaaS Admin Portal
4. Tenant Business Dashboard
5. Staff Portal
6. Client Portal
7. Public Tenant Booking Page
8. WordPress Plugin/API Integration
9. Future React Native Mobile App API Support

---

## 4. Tenancy Rules

This is a multi-tenant SaaS platform.

Each tenant represents a beauty business.

Tenant default URL:

```txt
workplace.domain.com/{tenant-slug}
```

Optional custom domain/CNAME:

```txt
bookings.clientdomain.com
```

Tenant branding:

- Business name
- Logo
- Banner image
- Brand color
- Description
- Contact phone
- WhatsApp number
- Social links
- Opening hours
- Location/branches

Tenant data must be isolated.

Most business records should include `tenant_id`.

---

## 5. Roles

Roles:

- Super Admin
- Office Admin
- Tenant Owner
- Manager
- Staff
- Client

Permissions should support:

- View
- Create
- Update
- Delete
- Export
- Manage billing
- Manage settings

---

## 6. Core Modules

Core SaaS modules:

- Authentication
- Tenant management
- Roles and permissions
- Dashboard layouts
- Branches
- Services
- Service categories
- Staff
- Customers
- Appointments/bookings
- Payments
- SaaS subscriptions
- Coupons
- SMS notifications
- Email notifications
- Reviews
- Inventory
- Reports and charts
- Tenant branding
- CNAME/custom domains
- WordPress plugin API
- Audit logs
- Settings

---

## 7. Suggested Database Tables

Use the current database style of the project, but include these concepts:

- users
- tenants
- tenant_domains
- tenant_branding
- branches
- roles
- permissions
- role_user
- permission_role
- staff_profiles
- customers
- service_categories
- services
- appointments
- appointment_services
- payments
- payment_gateways
- subscriptions
- plans
- coupons
- coupon_redemptions
- sms_logs
- notification_logs
- reviews
- inventory_items
- audit_logs
- settings
- support_tickets
- api_keys
- wordpress_connections

Every tenant-owned business table should be tenant-scoped.

Use soft deletes where useful.

Add indexes for common filters:

- tenant_id
- status
- created_at
- appointment date/time
- user_id
- branch_id
- staff_id

---

## 8. Batch Rules for Cursor

Every batch must follow these rules:

1. Inspect the existing project first.
2. Reuse existing structure.
3. Do not rebuild from scratch.
4. Do not duplicate files.
5. Keep code modular.
6. Keep UI clean and professional.
7. Use Shadcn UI where possible.
8. Use tenant-safe logic.
9. Add validation.
10. Add loading, empty, and error states.
11. Keep changes focused on the selected batch only.
12. Do not jump to future batches unless asked.

---

# BATCH 1 — UI Foundation & Theme

## Cursor Prompt

Read this file and execute Batch 1 only.

Improve the existing project UI foundation for BeautyOS.

Tasks:

- Set up or refine the Tailwind theme using the baby-pink SaaS color system.
- Add Plus Jakarta Sans as the main font and Inter as fallback.
- Create or improve reusable layout components:
  - AppShell
  - Sidebar
  - Topbar
  - PageHeader
  - MetricCard
  - EmptyState
  - LoadingSkeleton
  - DataTable wrapper
- Use Shadcn UI and Lucide icons.
- Make the dashboard clean, professional, responsive, and simple.
- Do not rebuild the whole app.
- Do not touch business logic unless required for layout.

Acceptance criteria:

- The app has a clean SaaS layout.
- Baby-pink theme is professional, not childish.
- Dashboard shell works on desktop and mobile.
- Reusable UI components are created.

---

# BATCH 2 — Authentication, Roles & Permissions

## Cursor Prompt

Read this file and execute Batch 2 only.

Build or refine authentication, roles, and permissions.

Tasks:

- Use Laravel Sanctum for API authentication.
- Support login/register/logout/current-user.
- Add roles:
  - Super Admin
  - Office Admin
  - Tenant Owner
  - Manager
  - Staff
  - Client
- Add permissions for view/create/update/delete/export/manage-billing/manage-settings.
- Add middleware/policies to protect API routes and dashboard pages.
- Add seeders for default roles and permissions.
- Keep existing auth if already present and improve it instead of replacing it.

Acceptance criteria:

- Users can authenticate securely.
- Roles exist and can be assigned.
- Protected routes check permissions.
- Code is clean and maintainable.

---

# BATCH 3 — Multi-Tenant Foundation

## Cursor Prompt

Read this file and execute Batch 3 only.

Build the multi-tenant SaaS foundation.

Tasks:

- Add tenants/businesses.
- Add tenant slug.
- Add tenant branding structure.
- Add tenant domains/CNAME table.
- Resolve tenant from:
  - `workplace.domain.com/{tenant-slug}`
  - custom tenant domain
- Add tenant middleware.
- Scope tenant-owned records safely.
- Prepare public booking page routing.

Acceptance criteria:

- Each tenant has isolated data.
- Tenant can be resolved from URL or custom domain.
- Tenant branding data exists.
- Existing auth still works.

---

# BATCH 4 — Super Admin & General Office Dashboard

## Cursor Prompt

Read this file and execute Batch 4 only.

Build the Super Admin and General Office dashboard.

Tasks:

- Create dashboard overview.
- Add tenant CRUD.
- Add user management.
- Add plans CRUD.
- Add subscription overview.
- Add coupons CRUD.
- Add payment overview.
- Add SMS usage overview.
- Add CNAME/domain management.
- Add support ticket list placeholder if support module is not ready.

UI requirements:

- Clean SaaS dashboard.
- Shadcn tables.
- Filters and search.
- Recharts for summary charts.
- Baby-pink accents.
- Professional spacing.

Acceptance criteria:

- Super Admin can manage platform-level records.
- General Office has operational visibility.
- UI is clean and production-ready.

---

# BATCH 5 — Tenant Business Dashboard

## Cursor Prompt

Read this file and execute Batch 5 only.

Build the Tenant Business Dashboard.

Tasks:

- Dashboard overview for tenant owner/manager.
- Show metrics:
  - Today’s bookings
  - Revenue
  - New customers
  - Pending appointments
- Add recent bookings table.
- Add upcoming appointments.
- Add quick actions:
  - Add booking
  - Add customer
  - Add staff
  - Add service
- Add clean navigation to tenant modules.

UI requirements:

- Premium baby-pink SaaS look.
- White cards.
- Soft borders.
- Rounded 2xl.
- Simple, calm dashboard.

Acceptance criteria:

- Tenant owner sees business data only.
- Dashboard is responsive and polished.

---

# BATCH 6 — Branches, Services, Staff & Customers CRUD

## Cursor Prompt

Read this file and execute Batch 6 only.

Build CRUD modules for:

- Branches
- Service categories
- Services
- Staff
- Customers

Tasks:

- Create tenant-scoped backend CRUD APIs.
- Create frontend pages with clean tables and forms.
- Add search, filters, pagination, status toggles, and validation.
- Use searchable selects for existing records.
- Add loading states, empty states, toasts, and delete confirmations.

Acceptance criteria:

- Tenant can manage branches, services, staff, and customers.
- UI is clean and not cluttered.
- CRUD logic works fully.

---

# BATCH 7 — Booking Engine

## Cursor Prompt

Read this file and execute Batch 7 only.

Build the booking engine.

Tasks:

- Select branch.
- Select service or multiple services.
- Select staff.
- Select date and time.
- Generate available slots.
- Prevent double booking.
- Create booking.
- Reschedule booking.
- Cancel booking.
- Support booking statuses:
  - pending
  - confirmed
  - completed
  - cancelled
  - no-show

UX rules:

- Use step-by-step booking flow.
- Use searchable selects.
- Keep the calendar/time-slot UI simple and beautiful.
- Work on mobile.

Acceptance criteria:

- Bookings are tenant-scoped.
- Double bookings are blocked.
- Booking flow is smooth and clean.

---

# BATCH 8 — Tenant Branding & Public Booking Page

## Cursor Prompt

Read this file and execute Batch 8 only.

Build tenant branding and public booking page.

Tasks:

- Tenant branding settings:
  - logo
  - banner
  - brand color
  - business description
  - phone
  - WhatsApp
  - social links
  - opening hours
- Public booking page uses tenant branding.
- Public page shows:
  - business info
  - services
  - staff
  - booking flow
- Support default workspace URL and custom domain routing.

Acceptance criteria:

- Each tenant can brand their page.
- Public booking page looks professional.
- Mobile experience is excellent.

---

# BATCH 9 — Payments & Subscriptions

## Cursor Prompt

Read this file and execute Batch 9 only.

Build payment and subscription foundation.

Payment gateways:

- Paystack
- Flutterwave

Tasks:

- Create payment gateway abstraction.
- Add booking payments.
- Add deposit payments.
- Add SaaS subscription payments.
- Add payment verification.
- Add webhook handling.
- Add payment history.
- Add failed payment logging.

Plans:

- Starter: GHS 99/month
- Growth: GHS 499/month
- Professional: GHS 1,299/month
- Enterprise: Custom

Acceptance criteria:

- Gateway logic is clean and extendable.
- Webhooks are secure.
- Tenants can have subscriptions.

---

# BATCH 10 — Coupons

## Cursor Prompt

Read this file and execute Batch 10 only.

Build coupons.

Coupons should work for:

- SaaS subscription discounts
- Tenant booking discounts

Fields:

- code
- type: percentage or fixed
- value
- usage limit
- used count
- start date
- expiry date
- active status
- tenant-specific or platform-wide
- applies to plan/service/customer where useful

Tasks:

- Backend CRUD.
- Validation.
- Redemption logic.
- Frontend management UI.
- Apply coupon in booking and subscription checkout.

Acceptance criteria:

- Coupons validate correctly.
- Expired/overused coupons are blocked.
- UI is clean.

---

# BATCH 11 — MNotify SMS & Email Notifications

## Cursor Prompt

Read this file and execute Batch 11 only.

Build SMS and email notifications.

SMS provider:

- MNotify

Use cases:

- OTP
- Booking confirmation
- Booking reminder
- Cancellation notice
- Payment alert
- Marketing message foundation

Tasks:

- Create SMS service class.
- Store SMS logs.
- Track tenant SMS usage.
- Use queues for sending.
- Add email notification templates.
- Add notification settings page.

Acceptance criteria:

- SMS keys are in env.
- SMS logs are saved.
- Notifications are queued.

---

# BATCH 12 — Reports, Charts & Analytics

## Cursor Prompt

Read this file and execute Batch 12 only.

Build reports and analytics.

Use:

- Recharts
- Shadcn UI

Reports:

- Revenue
- Bookings
- Customers
- Staff performance
- Popular services
- Payment status
- SMS usage
- Tenant growth for Super Admin
- Subscription MRR for Super Admin

Filters:

- Date range
- Branch
- Staff
- Service
- Status

Acceptance criteria:

- Charts are clean and readable.
- Reports are tenant-scoped where needed.
- Super Admin sees platform-wide analytics.

---

# BATCH 13 — WordPress Plugin API

## Cursor Prompt

Read this file and execute Batch 13 only.

Build WordPress plugin API support.

Backend endpoints:

- Generate tenant API key.
- Validate API key.
- Fetch services.
- Fetch staff.
- Fetch availability.
- Create booking.
- Redirect to payment.

Plugin scaffold:

- `wordpress-plugin` folder.
- Admin settings page.
- API key field.
- Booking widget shortcode.
- Services shortcode.

Acceptance criteria:

- WordPress websites can connect through API key.
- Plugin scaffold is simple and ready for expansion.

---

# BATCH 14 — Mobile App API Preparation

## Cursor Prompt

Read this file and execute Batch 14 only.

Prepare APIs for a future React Native mobile app.

Mobile app roles:

- Super Admin
- Tenant Owner
- Staff
- Client

Tasks:

- Ensure auth APIs are mobile-friendly.
- Add token refresh strategy if needed.
- Standardize API responses.
- Prepare push notification fields.
- Document endpoints.
- Create `/docs/mobile-api.md`.

Acceptance criteria:

- Future mobile app can use existing APIs.
- Responses are consistent.
- Documentation exists.

---

# BATCH 15 — Final Polish & Market Readiness

## Cursor Prompt

Read this file and execute Batch 15 only.

Polish the full app for market readiness.

Tasks:

- Review UI consistency.
- Fix spacing issues.
- Improve mobile responsiveness.
- Add missing empty/loading/error states.
- Improve accessibility.
- Improve API error handling.
- Improve validation messages.
- Check tenant isolation.
- Check permissions.
- Remove dead code.
- Improve README.

Acceptance criteria:

- App looks professional.
- App feels simple and smooth.
- No ugly layouts.
- Core flows work.
- Code is clean and maintainable.

---

## 9. Short Cursor Commands

Use these to save tokens:

```txt
Read BeautyOS_Cursor_Batch_Guide.md and execute Batch 1 only. Inspect existing code first. Do not rebuild from scratch.
```

```txt
Continue with Batch 2 from BeautyOS_Cursor_Batch_Guide.md only. Keep changes focused.
```

```txt
Fix issues in the last batch only. Do not add new features.
```

```txt
Refactor the current batch for cleaner UI and reusable components. Do not change business logic.
```

```txt
Review the current implementation against the acceptance criteria for this batch and list/fix gaps.
```

---

## 10. Build Order

Follow this exact order:

1. UI Foundation & Theme
2. Authentication, Roles & Permissions
3. Multi-Tenant Foundation
4. Super Admin & General Office Dashboard
5. Tenant Business Dashboard
6. Branches, Services, Staff & Customers CRUD
7. Booking Engine
8. Tenant Branding & Public Booking Page
9. Payments & Subscriptions
10. Coupons
11. MNotify SMS & Email Notifications
12. Reports, Charts & Analytics
13. WordPress Plugin API
14. Mobile App API Preparation
15. Final Polish & Market Readiness
