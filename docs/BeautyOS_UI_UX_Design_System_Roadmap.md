# BeautyOS UI/UX Design System Roadmap

This roadmap defines the UI/UX rules for BeautyOS across web, mobile phone, tablet, and iPad.

Use this file as the main design reference for Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Refactor gradually.
Reuse existing components where possible.

---

## Design Goal

BeautyOS must feel like a polished modern SaaS and mobile app for beauty businesses.

The interface should be:

- Clean
- Modern
- Premium
- Simple
- Fast
- Mobile-first
- Tablet-friendly
- Professional
- Easy for non-technical salon owners
- Beautiful enough for salons, spas, nail techs, barbers, and wellness brands

UI inspiration:

- Fresha
- GlossGenius
- Stripe Dashboard
- Linear
- Vercel
- Shopify Admin
- Notion Calendar
- Google Calendar
- Cron Calendar
- Apple iPad apps

Brand direction:

- Premium beauty SaaS
- Soft baby-pink accents
- White cards
- Calm spacing
- Elegant typography
- App-like experience

---

## Global Design Tokens

Use these as the default theme.

### Colors

```text
Primary Pink: #F8BBD0
Soft Pink Background: #FFF7FA
Accent Rose: #E879A6
Deep Rose: #DB2777
Text Dark: #1F2937
Text Muted: #6B7280
Border Soft: #F3D6E3
Card Background: #FFFFFF
App Background: #FAFAFA
Success: #16A34A
Warning: #F59E0B
Error: #DC2626
Info: #2563EB
```

Use baby-pink as an accent, not as the whole background.
The app should feel premium, not childish.

### Fonts

Use:

```text
Primary: Plus Jakarta Sans
Fallback: Inter
Display optional: Poppins
```

Rules:

- Use strong readable headings.
- Use medium body text.
- Keep text spacing clean.
- Avoid tiny unreadable text on mobile.

### Shape

```text
Cards: rounded-2xl
Buttons: rounded-xl
Inputs: rounded-xl
Modals: rounded-2xl
Tables: rounded-xl container
```

### Shadows

Use subtle soft shadows only.
Avoid heavy dark admin-template shadows.

---

## Responsive Rules

BeautyOS must be 100% responsive.

Support:

- Mobile phone
- Tablet
- iPad
- Desktop
- Large desktop

### Mobile Phone Rules

Mobile should feel like a real app.

Use:

- Bottom navigation for tenant/staff/client daily actions
- Sticky top header where useful
- Single-column screens
- Large touch targets
- Swipe-friendly cards
- Compact filters
- Bottom sheets instead of large modals
- Floating action button for primary action where useful
- Simple tabs
- Clear empty states

Minimum touch target:

```text
44px height
```

### Tablet / iPad Rules

Tablet should not look like stretched mobile.

Use:

- Two-column layouts
- Sidebar + detail panel
- Calendar grid views
- Split screens
- Larger cards
- More visible filters
- Persistent side navigation where space allows

Examples:

```text
Staff list left + staff profile right
Bookings list left + booking detail right
Payment requests left + status timeline right
Calendar staff columns across screen
```

### Desktop Rules

Use:

- Full sidebar
- Topbar
- Data tables
- Charts
- Command palette
- Filter bars
- Detail drawers

---

## Navigation System

### Web Dashboard

Use:

- Left sidebar
- Topbar
- Breadcrumbs where useful
- Page header
- Primary action button
- Search/filter bar

Sidebar sections:

- Dashboard
- Calendar
- Bookings
- Customers
- Staff
- Services
- Payments
- SMS
- Reports
- Settings

### Mobile App

Use bottom tabs for daily tenant operations:

- Home
- Calendar
- Bookings
- Customers
- More

For staff:

- Today
- Schedule
- Clients
- Earnings
- More

For Super Admin mobile:

- Overview
- Tenants
- Payments
- Support
- Alerts

---

## Calendar Design Rules

Calendar is a core feature. Make it modern and beautiful.

Use Shadcn UI where possible.
For advanced scheduling, build custom calendar components using clean Tailwind styles.

Calendar should support:

- Day view
- Week view
- Month view where useful
- Staff column view
- Agenda view for mobile
- Tablet split calendar
- Today button
- Date picker
- Staff filter
- Branch filter
- Service filter
- Status filter

### Web Calendar

Use a layout like:

```text
Top toolbar:
[Today] [Previous] [Next] [Date Picker] [Day | Week | Month] [Branch] [Staff]

Calendar body:
Time column left
Staff columns or day columns
Appointment cards inside slots
Breaks and lunch blocks
Time off blocks
Unavailable states
```

Appointment cards should show:

- Customer name
- Service
- Time
- Staff initials/avatar
- Payment/status badge

### Mobile Calendar

Do not force desktop calendar onto phone.

Use:

- Agenda list
- Day timeline
- Swipe dates
- Staff filter
- Large appointment cards
- Quick actions

Mobile calendar screens:

```text
Today timeline
Upcoming bookings
Staff filter
Tap booking -> bottom sheet details
```

### Tablet Calendar

Use:

- Staff column calendar
- Day/week toggle
- Side detail panel
- Drag-friendly layout if possible later

### Calendar Status Colors

Use semantic colors:

- Confirmed: green
- Pending: amber
- Cancelled: red
- Completed: blue
- No-show: gray/dark
- Break: muted purple
- Time off: soft orange

Keep color use calm and professional.

---

## Search, Select & Data Entry Rules

Important rule:
Do not make users type data that already exists in the system.

Use search/select components wherever possible.

Examples:

- Select customer instead of typing customer name repeatedly.
- Select staff from staff list.
- Select service from service catalog.
- Select branch from branches.
- Select coupon from coupon list.
- Select role from roles.
- Select payment reason from suggestions.
- Select time off purpose from suggestions.
- Select sender ID from approved sender IDs.

### Components to Use

Use:

- Combobox
- Searchable select
- Multi-select
- Command palette
- Autocomplete
- Recent items
- Smart suggestions
- Saved filters

### When Creating New Data

If data does not exist, allow:

```text
+ Create new customer
+ Add new service
+ Add new staff member
```

But always search existing records first.

### Global Search

Add global search for:

- Customers
- Bookings
- Staff
- Services
- Payments
- Invoices
- Tenants
- Support tickets

---

## Form Design Rules

Forms should be simple and not overwhelming.

Use:

- Sectioned forms
- Good spacing
- Inline validation
- Helpful descriptions
- Required indicators
- Searchable selects
- Date/time pickers
- Step forms for complex flows

Avoid:

- Huge long forms without grouping
- Too many fields at once
- Raw dropdowns with hundreds of items
- Ugly browser default inputs

For mobile:

- One field group at a time
- Bottom sheet pickers
- Sticky submit button
- Large inputs

---

## Data Table Rules

Tables should be clean and powerful.

Use:

- Search
- Filters
- Sort
- Pagination
- Column visibility where useful
- Bulk actions where useful
- Export where useful
- Status badges
- Row actions menu
- Detail drawer

Mobile:

- Convert tables to cards
- Show most important data only
- Use quick action buttons

Tablet:

- Use table + detail panel

---

## Cards & Dashboard Rules

Dashboard should be clear at a glance.

Use cards for:

- Revenue
- Bookings
- Customers
- Staff available
- Staff on leave
- Pending payments
- SMS balance
- Failed payments
- Support tickets

Metric cards should include:

- Icon
- Label
- Value
- Trend
- Short description

Charts should be clean and readable.
Use Recharts.

Charts:

- Revenue trend
- Booking trend
- Staff utilization
- Payment success rate
- SMS usage
- Tenant growth
- Payroll trend

---

## Status & Connection UI

Every integration/status feature should have clear status UI.

Use status badges for:

- Connected
- Pending
- Failed
- Disabled
- Blocked
- Syncing
- Verified
- Needs attention

Use connection cards for:

- MTN MoMo
- Paystack
- Flutterwave
- SeerBit
- MNotify
- CNAME/domain
- Email provider

Each connection card should show:

- Provider name
- Status
- Last checked
- Last successful sync
- Error message if failed
- Action buttons

Actions:

- Connect
- Verify
- Retry
- Disconnect
- View logs

---

## Empty, Loading & Error States

Never leave blank screens.

### Empty State

Use:

- Icon
- Short title
- Helpful description
- Primary action

Example:

```text
No staff members yet
Add your first staff member to start accepting bookings.
[Add Staff]
```

### Loading State

Use:

- Skeleton cards
- Skeleton table rows
- Calendar skeleton
- Form loading state

### Error State

Use:

- Clear message
- What went wrong
- Retry button
- Support/contact option for serious errors

---

## App-Like Mobile Experience

Mobile should look and feel like a native app.

Use:

- Safe area spacing
- Bottom tabs
- Bottom sheets
- Swipe gestures where useful
- Pull-to-refresh where useful
- Large tap targets
- Native-feeling lists
- Floating action buttons
- Sticky action bars

Avoid:

- Desktop tables on phone
- Tiny buttons
- Horizontal overflow
- Unreadable charts
- Large modals that do not fit screen

---

## Accessibility Rules

Use:

- Good contrast
- Visible focus states
- Keyboard navigation
- Proper labels
- ARIA where needed
- Text not smaller than 14px for important content
- Tap targets at least 44px on mobile

---

# Cursor Batches

## Batch UI-1 - Design Tokens & Theme Foundation

Tasks:

- Review existing theme.
- Add or refine Tailwind design tokens.
- Add BeautyOS baby-pink palette.
- Add font setup: Plus Jakarta Sans and Inter fallback.
- Add radius, border, shadow, and spacing standards.
- Create theme documentation.
- Ensure dark/light mode does not break UI if present.

Acceptance criteria:

- App has consistent theme tokens.
- Baby pink is used professionally as accent.
- Typography is consistent.

---

## Batch UI-2 - App Shell, Navigation & Responsive Layout

Tasks:

- Build/refactor web AppShell.
- Build/refactor Sidebar.
- Build/refactor Topbar.
- Add PageHeader component.
- Add mobile bottom navigation.
- Add tablet split layout helpers.
- Add responsive layout utilities.

Acceptance criteria:

- Web, mobile, and tablet layouts feel intentional.
- No horizontal overflow.
- Navigation is clean and easy.

---

## Batch UI-3 - Core UI Components

Create/refactor reusable components:

- MetricCard
- EmptyState
- LoadingSkeleton
- ErrorState
- StatusBadge
- ConnectionStatusCard
- DataTable wrapper
- DetailDrawer
- ConfirmDialog
- SearchInput
- FilterBar
- PageTabs
- ActionMenu

Acceptance criteria:

- Pages reuse consistent components.
- UI looks polished and maintainable.

---

## Batch UI-4 - Searchable Selects & Smart Data Entry

Tasks:

- Build SearchableSelect component.
- Build MultiSelect component.
- Build CustomerSelect.
- Build StaffSelect.
- Build ServiceSelect.
- Build BranchSelect.
- Build RoleSelect.
- Build CouponSelect.
- Add create-new option where appropriate.
- Replace raw text inputs where existing data should be selected.

Acceptance criteria:

- Users do not type repeated data unnecessarily.
- Existing data is easy to find and select.

---

## Batch UI-5 - Modern Calendar System

Tasks:

- Build/refactor calendar UI.
- Support day, week, and agenda views.
- Add staff column view for web/tablet.
- Add mobile agenda/day timeline.
- Add date picker.
- Add Today, previous, next actions.
- Add filters for branch, staff, service, and status.
- Show appointments, breaks, lunch, time off, unavailable states.
- Use beautiful appointment cards.

Acceptance criteria:

- Calendar is modern, responsive, and useful.
- Mobile does not show a cramped desktop calendar.
- Tablet calendar feels like an app.

---

## Batch UI-6 - Tables, Cards & Lists Polish

Tasks:

- Refactor major tables into clean Shadcn-style tables.
- Convert mobile tables into cards.
- Add filters, search, sort, pagination.
- Add row actions and detail drawers.
- Add bulk actions where useful.
- Improve staff, customer, service, booking, payment, and tenant lists.

Acceptance criteria:

- Data-heavy pages are clean and easy to use.
- Mobile lists are readable and tappable.

---

## Batch UI-7 - Forms, Modals & Bottom Sheets

Tasks:

- Refactor forms into clean sections.
- Add validation messages.
- Use date/time pickers.
- Use searchable selects.
- Use bottom sheets on mobile.
- Use modals/drawers on desktop.
- Add sticky mobile submit bars.

Acceptance criteria:

- Forms are simple and professional.
- Mobile form experience feels native.

---

## Batch UI-8 - Dashboard & Analytics UI Polish

Tasks:

- Improve dashboard cards.
- Improve chart styling.
- Add Recharts components.
- Add clean filter controls.
- Add responsive chart layouts.
- Add staff availability cards:
  - Available now
  - On leave today
  - Working today
  - Bookable staff
- Add payment, SMS, and tenant metrics cards where relevant.

Acceptance criteria:

- Dashboards look executive-ready.
- Charts are readable on web, phone, and tablet.

---

## Batch UI-9 - Mobile & Tablet App Experience Polish

Tasks:

- Audit every major screen on phone.
- Audit every major screen on tablet/iPad.
- Fix spacing, overflow, and tap targets.
- Add bottom navigation.
- Add split layouts for tablet.
- Add mobile-friendly cards.
- Add app-like headers and actions.

Acceptance criteria:

- App is fully responsive.
- Phone and tablet can support 60-80% of daily tenant operations.
- UI feels like an app, not a squeezed website.

---

## Batch UI-10 - Final UI/UX Quality Review

Tasks:

- Review UI consistency.
- Remove ugly default styles.
- Fix inconsistent spacing.
- Fix inconsistent buttons.
- Fix inconsistent badges.
- Fix inconsistent empty/loading/error states.
- Check accessibility.
- Check responsiveness.
- Update design documentation.

Acceptance criteria:

- BeautyOS feels polished, modern, and market-ready.
- UI is consistent across web, mobile phone, tablet, and iPad.
