# BeautyOS Product Quality Standard Roadmap

This file defines the quality standard every BeautyOS feature must follow.

Use this file in Cursor before building or refactoring any feature.
Always inspect existing code first.
Do not rebuild from scratch.
Apply these standards across backend, web frontend, mobile phone UI, and mobile tablet/iPad UI.

---

## Product Goal

BeautyOS must be:

- Easy to use
- Fast
- Beautiful
- Mobile/tablet friendly
- Reliable
- Simple for non-technical users

The product should feel like a modern app that salon owners, receptionists, nail techs, barbers, spa managers, and staff can use without training.

---

## Design Inspiration

Use the simplicity and polish of:

- PayPal
- Stripe
- Square
- Shopify Admin
- Fresha
- Linear
- Vercel
- Notion

But keep the experience simpler for beauty businesses.

---

# Core Principles

## 1. Easy to Use

Every screen should answer:

- What is this page for?
- What do I do next?
- What is the main action?
- What needs my attention?

Rules:

- Use plain English.
- Avoid technical terms.
- Keep one main action per page.
- Use clear labels.
- Use helpful descriptions.
- Use icons with text.
- Show next steps.
- Do not overload screens.
- Hide advanced settings unless needed.
- Use guided steps for complex flows.

Bad labels:

```text
Configure Provider
RBAC
Ledger
Webhook
CNAME
```

Better labels:

```text
Payment Setup
Roles & Access
Transaction History
Payment Update Connection
Custom Domain
```

Acceptance criteria:

- A non-technical user can understand the page in 5 seconds.
- A new user can complete the main action without asking for help.

---

## 2. Fast

BeautyOS must feel quick on web, phone, and tablet.

Frontend rules:

- Lazy-load heavy components.
- Lazy-load charts.
- Lazy-load calendars.
- Use pagination or infinite loading for large lists.
- Use skeleton loaders.
- Use optimistic UI where safe.
- Debounce search.
- Cache common dropdown data.
- Avoid unnecessary re-renders.
- Avoid loading huge data on first page load.
- Use image optimization.
- Keep mobile screens lightweight.

Backend rules:

- Add database indexes.
- Use pagination.
- Use API filters.
- Avoid N+1 queries.
- Use queues for slow jobs.
- Cache expensive reports.
- Use background jobs for SMS, email, payment checks, reports, and exports.
- Return only needed data to mobile.

Performance targets:

- Dashboard initial load: under 2 seconds where possible.
- Mobile screen transitions should feel instant.
- Search should respond quickly.
- Heavy reports can show loading state but must not freeze the app.

Acceptance criteria:

- No page feels stuck.
- Large tables do not freeze.
- Mobile app feels smooth.
- Users always see loading feedback.

---

## 3. Beautiful

BeautyOS should feel premium, clean, and modern.

Visual style:

- Baby-pink accent, not childish.
- White cards.
- Soft gray backgrounds.
- Rounded 2xl cards.
- Rounded-xl buttons.
- Soft borders.
- Calm shadows.
- Clean typography.
- Generous spacing.
- Beautiful empty states.
- Modern icons.
- Clear status badges.

Design tokens:

```text
Primary: #F8BBD0
Primary Strong: #E879A6
Background: #FFF7FA
Surface: #FFFFFF
Text Strong: #111827
Text Normal: #374151
Text Muted: #6B7280
Border: #F3D6E3
Success: #16A34A
Warning: #F59E0B
Danger: #DC2626
Info: #2563EB
```

Typography:

```text
Primary font: Plus Jakarta Sans
Fallback: Inter
```

Components should use:

- Shadcn UI on web
- React Native components on mobile
- Lucide icons or matching icons
- Recharts for charts
- Modern calendar components
- Clean cards
- Searchable selects
- Rounded checkboxes
- Modern switches
- Bottom sheets on mobile
- Split views on tablet

Acceptance criteria:

- No screen looks like a basic admin template.
- The app feels premium enough to sell.
- The UI is consistent across modules.

---

## 4. Mobile and Tablet Friendly

Many shops may not have laptops. BeautyOS must support 60-80% of daily operations on phone/tablet.

Mobile phone rules:

- Use bottom tab navigation.
- Use app-like headers.
- Use large tap targets.
- Use single-column layouts.
- Use bottom sheets for actions.
- Use cards instead of tables.
- Use sticky primary buttons.
- Avoid tiny text.
- Avoid horizontal scrolling.
- Keep forms short.
- Break long forms into steps.
- Use camera/scanner placeholders where useful.
- Use native share/copy actions where possible.

Tablet/iPad rules:

- Use split views.
- Use two-column layouts.
- Use compact sidebar.
- Use calendar staff columns.
- Use POS product grid + checkout panel.
- Use client list + profile panel.
- Use messages inbox + conversation panel.
- Use finance cards + table layout.

Daily tasks that should work well on mobile/tablet:

- View today’s schedule
- Create booking
- Reschedule/cancel booking
- Add client
- Add service
- Add staff
- Take payment
- Send payment request
- View client profile
- Send SMS/WhatsApp/email
- View staff schedule
- Request/approve time off
- View wallet/finance summary
- Record expense
- Checkout POS sale
- View reports summary

Acceptance criteria:

- A shop can operate daily without a laptop.
- Mobile feels like an app, not a squeezed website.
- Tablet feels like a business dashboard.

---

## 5. Reliable

BeautyOS must protect business data and avoid mistakes.

Reliability rules:

- Validate all inputs.
- Show helpful error messages.
- Use confirmation dialogs for dangerous actions.
- Prevent duplicate submissions.
- Prevent double bookings.
- Prevent duplicate payments.
- Prevent duplicate wallet credits.
- Use idempotency for webhooks.
- Use audit logs for sensitive actions.
- Use tenant isolation everywhere.
- Use role/permission checks everywhere.
- Use safe fallbacks when providers fail.
- Use retry jobs for SMS, email, payments, and reports.
- Never silently fail.

Important confirmations:

- Delete record
- Cancel booking
- Refund payment
- Adjust wallet
- Approve payout
- Change role/permissions
- Disable tenant
- Remove domain
- Send bulk campaign

Status feedback:

- Saved
- Sending
- Sent
- Delivered
- Failed
- Pending
- Processing
- Paid
- Refunded
- Cancelled
- Expired

Acceptance criteria:

- Users trust the system.
- Failed actions are visible and understandable.
- Sensitive records are auditable.

---

## 6. Simple for Non-Technical Users

BeautyOS should hide complexity.

Use simple labels:

```text
Business instead of Tenant
Workspace instead of Tenant Account
Roles & Access instead of RBAC
Transaction History instead of Ledger
Custom Domain instead of CNAME
Payment Update Connection instead of Webhook
Connection Key instead of API Key
Payment Service instead of Provider
Payout instead of Settlement
```

Use friendly instructions:

```text
Clients will use this link to book online.
Your customer will approve payment on their own phone.
Choose which services this staff member can perform.
This staff member is bookable online.
This message will be sent to clients who match your selected group.
```

Use guided flows:

- Onboarding
- Payment setup
- Booking page setup
- Custom domain setup
- Staff schedule setup
- SMS sender ID setup
- Campaign setup
- Payroll setup

Acceptance criteria:

- Users do not need IT knowledge.
- Advanced settings are explained clearly.
- Daily screens use business language.

---

# Standard Page Layout

Every main page should follow this structure:

```text
Page title
Short description
Primary action button
Summary cards if useful
Search/filter bar if list page
Main content
Empty/loading/error states
Secondary actions
```

---

# Standard Mobile Layout

Every mobile screen should follow:

```text
Header
Short page title
Key summary card if useful
Main list/cards
Floating or sticky primary action
Bottom tab navigation
```

Avoid:

- Wide tables
- Tiny filters
- Too many buttons
- Desktop sidebar
- Long complex forms on one screen

---

# Standard Tablet Layout

Every tablet screen should prefer:

```text
Sidebar or compact navigation
Main content grid
Split view for detail-heavy pages
Sticky action panel where useful
```

Examples:

- Calendar: staff columns
- Clients: list left, profile right
- POS: products left, cart right
- Messages: inbox left, conversation right
- Finance: cards top, table below
- Settings: menu left, settings panel right

---

# Search and Smart Data Entry Rules

Do not make users type what already exists.

Use searchable selects for:

- Clients
- Staff
- Services
- Branches
- Products
- Coupons
- Roles
- Payment methods
- Sender IDs
- Memberships
- Packages
- Gift cards
- Suppliers
- Segments

Smart select requirements:

- Search
- Recent items
- Create new option where useful
- Avatars/initials for people
- Price/duration for services
- Stock/price for products
- Status badges
- Keyboard accessible
- Mobile-friendly bottom sheet version

Acceptance criteria:

- Data entry is faster.
- Duplicate records are reduced.
- Users type less.

---

# Calendar UX Standard

The calendar should be modern and simple.

Required calendar views:

- Day
- Week
- Staff columns
- Agenda view on mobile
- Month placeholder where useful

Calendar should show:

- Bookings
- Breaks
- Lunch
- Time off
- Unavailable time
- Staff avatars/initials
- Booking status colors
- Service name
- Client name
- Time
- Payment status where useful

Calendar actions:

- Create booking from empty slot
- Open booking drawer
- Reschedule booking
- Filter by staff
- Filter by branch
- Today button
- Date picker

Mobile calendar:

- Agenda first
- Swipe dates
- Large booking cards
- Staff filter
- Floating New Booking button

Tablet calendar:

- Staff column day view
- Booking detail side panel

Acceptance criteria:

- Receptionist can manage the day easily.
- Staff can see their schedule clearly.
- Calendar is fast and not cluttered.

---

# Dashboard UX Standard

Dashboards should not be overwhelming.

Tenant home dashboard should show:

- Today’s bookings
- Revenue today
- Pending payments
- Staff available
- Quick actions
- Recent activity
- Setup checklist if needed

Quick actions:

- New Booking
- Add Client
- Take Payment
- Send Message
- Add Service

General Office dashboard should show:

- Active tenants
- MRR
- Failed payments
- Open support tickets
- Provider health
- SMS balance
- Pending settlements

Acceptance criteria:

- Dashboard tells users what matters now.
- Deep reports stay in Reports/Finance pages.

---

# Forms UX Standard

Forms should be friendly and short.

Rules:

- Use grouped sections.
- Use helper text.
- Use inline validation.
- Use clear labels.
- Use save/cancel actions.
- Use sticky footer on long forms.
- Use steps for complex forms.
- Use toggles for yes/no.
- Use radio cards for major choices.
- Use rounded checkboxes for multiple options.

Avoid:

- Huge forms with no structure.
- Technical field names.
- Too many required fields.
- Unclear errors.

Acceptance criteria:

- Users can complete forms without confusion.
- Errors tell users how to fix the problem.

---

# Feedback States Standard

Every async action must show feedback.

Required states:

- Loading
- Empty
- Error
- Success
- Disabled
- Processing
- Retry available

Examples:

```text
Saving...
Saved successfully.
Could not send SMS. Try again.
No clients yet. Add your first client to start booking.
Payment is waiting for customer approval.
```

Acceptance criteria:

- Users always know what is happening.
- Errors are human-readable.

---

# Accessibility Standard

Use:

- High contrast text
- Keyboard navigation
- Proper labels
- Large tap targets
- Focus states
- Screen-reader-friendly components
- Avoid color-only status indicators
- Support reduced motion where possible

Acceptance criteria:

- The app is usable by more people.
- Statuses are understandable without relying only on color.

---

# Batch Q1 - Apply Quality Standard to Core Layout

Tasks:

- Review web app shell.
- Review mobile app shell.
- Review tablet layout.
- Simplify sidebar.
- Add bottom tabs on mobile where needed.
- Improve page headers.
- Improve primary actions.
- Add consistent cards, buttons, inputs, switches, checkboxes.
- Remove clutter.
- Use non-technical labels.

Acceptance criteria:

- App navigation is simple.
- Web, phone, and tablet feel consistent.
- Non-technical users understand the structure.

---

# Batch Q2 - Apply Quality Standard to Booking, Calendar & Clients

Tasks:

- Upgrade calendar UI.
- Upgrade booking flow.
- Upgrade client profile/list.
- Add smart selects.
- Add loading/empty/error states.
- Make mobile agenda view app-like.
- Make tablet calendar split view.

Acceptance criteria:

- Booking and client flows are easy and fast.
- Calendar is modern and usable.

---

# Batch Q3 - Apply Quality Standard to Payments, Finance & POS

Tasks:

- Simplify checkout.
- Improve payment request UI.
- Improve POS mobile/tablet flow.
- Improve finance dashboard.
- Improve transaction lists.
- Add status badges and timelines.
- Use cards on mobile and tables on desktop.

Acceptance criteria:

- Taking payment is simple.
- Finance screens feel trustworthy and clear.

---

# Batch Q4 - Apply Quality Standard to Staff, Communications & Settings

Tasks:

- Simplify staff screens.
- Improve schedule/time off screens.
- Improve communications composer.
- Improve campaign builder.
- Simplify settings pages.
- Hide advanced technical settings behind advanced sections.
- Add helpful microcopy.

Acceptance criteria:

- Staff and messaging tools are easy to use.
- Settings do not overwhelm users.

---

# Batch Q5 - Performance, Reliability & Final UX Review

Tasks:

- Check slow pages.
- Add lazy loading where needed.
- Add pagination where needed.
- Add skeleton loaders.
- Add error states.
- Add confirmation dialogs.
- Check mobile/tablet responsiveness.
- Check tenant isolation.
- Check permission guards.
- Check audit logs for sensitive actions.
- Update UI documentation.

Acceptance criteria:

- App is fast, reliable, beautiful, and market-ready.
