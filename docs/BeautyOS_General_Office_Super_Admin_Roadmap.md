# BeautyOS General Office & Super Admin Roadmap

This roadmap builds a powerful General Office / Super Admin command center for BeautyOS.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, auth, roles, payments, SMS, MTN MoMo, SeerBit, booking, staff, reports, notification, support, web, and mobile patterns.

## Feature Goal

Build a premium SaaS operations dashboard where the BeautyOS internal team can manage the entire platform, support tenants, monitor revenue, track system health, manage billing, configure payment/SMS providers, approve domains, investigate issues, and deliver great service.

Internal roles:
- Super Admin
- General Office Admin
- Support Agent
- Finance Admin
- Operations Manager
- Developer/Admin Engineer

## Cross-Platform Rule

Every batch should include where relevant:
1. Laravel backend API
2. Web frontend
3. Mobile phone UI
4. Mobile tablet UI

Some General Office features may be web-first, but mobile/tablet should support urgent operations such as tenant lookup, support tickets, payment status, provider health, and alerts.

## Design Rules

Use:
- Clean premium SaaS UI
- Baby-pink BeautyOS accent theme
- White cards
- Soft borders
- Rounded 2xl
- Shadcn UI
- Lucide icons
- Recharts
- Clean tables
- Powerful filters
- Search
- Export actions
- Command palette
- Status badges
- Activity timelines
- Empty states
- Loading skeletons
- Error states
- Audit-friendly layouts

UI inspiration:
- Stripe Dashboard
- Linear
- Vercel
- Shopify Admin
- Grafana
- Fresha Business Dashboard

---

## Batch 121 - Super Admin Command Center Foundation

Backend:
- Create platform metrics API.
- Create admin overview API.
- Protect dashboard with platform roles.
- Add permissions: office.dashboard.view, office.tenants.view, office.operations.view, office.finance.view, office.support.view, office.settings.manage.

Web:
- Build Super Admin / General Office layout.
- Sidebar: Overview, Tenants, Subscriptions, Payments, Settlements, SMS Hub, Domains, Support, Reports, Provider Health, Audit Logs, System Settings.
- Topbar: global search, alerts, command palette placeholder, admin profile.
- Dashboard cards: Active tenants, Trial tenants, MRR, Revenue collected, Failed payments, Open support tickets, SMS balance, Provider incidents.
- Charts: MRR trend, Tenant growth, Payment volume, Support ticket trend.

Mobile phone:
- General Office overview with urgent cards: alerts, failed payments, support tickets, provider health, tenant search.

Mobile tablet:
- Dashboard cards and charts in tablet grid.

Acceptance criteria:
- General Office has a polished command center.
- Platform metrics are protected by permissions.
- UI is clean and executive-ready.

---

## Batch 122 - Tenant Management Center

Backend:
- APIs: list tenants, view tenant profile, create tenant, update tenant, suspend tenant, reactivate tenant, archive tenant where safe.
- Add impersonation/view-as-tenant placeholder with audit logs.
- Tenant data: name, slug, owner, plan, subscription status, onboarding status, payment status, SMS balance, domain status, risk status, created_at, last_active_at.

Web:
- Tenants table with filters: plan, status, trial, suspended, country, payment mode, onboarding status, low SMS balance, failed payments.
- Tenant profile tabs: overview, owner/contact, subscription, payments, wallet, SMS, staff count, bookings count, domain, support tickets, audit timeline.
- Actions: suspend, reactivate, change plan, send message, view as tenant with audit, reset onboarding, add internal note.

Mobile phone:
- Tenant search, quick profile, contact owner, view risk/status, suspend/reactivate if permitted.

Mobile tablet:
- Tenant list and detail split view.

Acceptance criteria:
- General Office can manage all tenants cleanly.
- Sensitive actions require confirmation and audit logs.

---

## Batch 123 - SaaS Plans, Subscriptions & Billing

Backend:
- APIs for plans CRUD, subscriptions list/detail, manual plan assignment, trial extension, cancel subscription, reactivate subscription, billing status sync, invoice generation placeholder.
- Plans: Starter, Growth, Professional, Enterprise.
- Add-ons: SMS packages, extra staff, extra branch, custom domain, marketing suite, AI assistant, white label.

Web:
- Plans CRUD page.
- Subscription dashboard.
- Tenant subscription detail.
- Billing timeline.
- Failed billing report.
- Trial expiry report.
- Revenue chart.
- MRR and ARR cards.
- Churn and upgrade/downgrade tracking.

Mobile phone:
- Billing summary, failed payment alerts, tenant subscription quick view.

Mobile tablet:
- Subscription table plus detail panel.

Acceptance criteria:
- General Office can manage SaaS plans and subscriptions.
- Billing status is easy to understand.

---

## Batch 124 - Payment Operations Dashboard

Gateways:
- Paystack
- Flutterwave
- MTN MoMo
- SeerBit USSD
- Cash/manual placeholder

Backend:
- Aggregate payment requests.
- Aggregate successful/failed transactions.
- Add provider, status, tenant, and date filters.
- Add reconciliation status.
- Add export.

Web:
- Payment Operations dashboard.
- Cards: Total processed, Successful payments, Failed payments, Pending payments, Gateway fees, Platform fees, Reconciliation issues.
- Tables: Recent transactions, Failed transactions, Pending approvals, Webhook issues.
- Actions: verify payment, retry status check, view provider response, download receipt, flag transaction, add internal note.

Mobile phone:
- Failed/pending payment monitoring and quick verify action if permitted.

Mobile tablet:
- Payment operations table plus detail timeline.

Acceptance criteria:
- General Office can monitor and troubleshoot payments.
- Provider responses are visible only to permitted users.

---

## Batch 125 - Settlements, Wallets & Payouts Operations

Backend:
- Aggregate tenant wallets and settlement requests.
- Add settlement approval APIs.
- Add mark paid APIs.
- Add payout failure handling.
- Add settlement liability report.
- Add wallet adjustment with strict permissions.

Web:
- Settlements dashboard.
- Cards: Total tenant balances, Pending settlements, Approved payouts, Paid settlements, Failed settlements, Settlement liability.
- Tables: Tenant wallet balances, Payout requests, Settlement history, Wallet adjustments.
- Actions: approve payout, reject payout, mark paid, adjust wallet, export settlement report, view wallet ledger.

Mobile phone:
- Pending payouts, approve/reject urgent payouts, tenant wallet quick view.

Mobile tablet:
- Payout queue plus detail panel.

Acceptance criteria:
- General Office can manage tenant settlements safely.
- Wallet movements are auditable.

---

## Batch 126 - SMS Reseller Operations Hub

Backend:
- Aggregate tenant SMS wallets.
- Sync MNotify balance.
- Manage SMS packages.
- Sender ID approvals.
- Delivery logs.
- Low balance alerts.
- SMS revenue reporting.

Web:
- SMS Hub dashboard.
- Cards: MNotify master balance, Total SMS sold, Total SMS used, Tenant low balance count, Pending Sender IDs, Failed deliveries.
- Pages: SMS packages CRUD, Tenant SMS wallets, Sender ID requests, Delivery logs, SMS invoices, SMS analytics.
- Actions: approve sender ID, reject sender ID, block sender ID, allocate SMS credits, create SMS invoice, sync MNotify balance, export logs.

Mobile phone:
- Pending Sender ID approvals, low balance tenants, failed delivery alerts.

Mobile tablet:
- SMS operations dashboard.

Acceptance criteria:
- General Office can run SMS as a reseller business.
- Sender ID and delivery issues are easy to manage.

---

## Batch 127 - Domain, Workspace & CNAME Operations

Backend:
- Aggregate tenant domains.
- DNS verification status.
- SSL status.
- Provider reference.
- Domain audit logs.
- Manual verify/retry endpoints.
- Block/unblock domain.

Web:
- Domain Operations dashboard.
- Cards: Total domains, Connected, Pending DNS, SSL pending, Failed, Blocked.
- Domain table filters: tenant, status, DNS status, SSL status, date added.
- Domain detail: DNS instructions, last check, provider response, status timeline, admin notes.
- Actions: verify, retry SSL, block, unblock, remove, add note.

Mobile phone:
- Failed/pending domains and verify/retry if permitted.

Mobile tablet:
- Domain list plus detail panel.

Acceptance criteria:
- General Office can support tenant custom domains professionally.

---

## Batch 128 - Support Desk & Tenant Success

Backend:
- Create or improve support_tickets.
- Fields: tenant_id, submitted_by_user_id, assigned_to_user_id, subject, category, priority, status, description, internal_notes, last_response_at, resolved_at.
- Create ticket messages/comments.
- Add SLA fields.
- Add tenant health score foundation.

Web:
- Support dashboard.
- Ticket inbox.
- Tenant profile support history.
- SLA badges.
- Priority filters.
- Internal notes.
- Assign ticket.
- Change status.
- Reply placeholder.
- Tenant success board: onboarding incomplete, inactive tenants, low booking activity, payment failures, low SMS balance, domain setup stuck.

Mobile phone:
- Support ticket inbox, reply/status update, urgent SLA alerts.

Mobile tablet:
- Ticket inbox plus conversation panel.

Acceptance criteria:
- General Office can support tenants properly.
- Tenant success risks are visible.

---

## Batch 129 - Provider Health & Incident Monitoring

Providers:
- Paystack
- Flutterwave
- MTN MoMo
- SeerBit
- MNotify
- Email provider
- Storage provider
- Domain/hosting provider

Backend:
- Create provider_health_checks table.
- Create provider_incidents table.
- Store provider, status, last_checked_at, response_time_ms, last_error, incident notes.
- Add scheduled health checks where possible.

Web:
- Provider Health dashboard.
- Status cards.
- Uptime trend.
- Recent errors.
- Incident timeline.
- Manual check action.
- Internal incident notes.

Mobile phone:
- Provider status overview and critical alerts.

Mobile tablet:
- Provider health dashboard.

Acceptance criteria:
- General Office knows when external providers are failing.
- Support can explain issues to tenants.

---

## Batch 130 - Platform Reports & Executive Analytics

Reports:
- MRR
- ARR
- Revenue
- Tenant growth
- Churn
- Trial conversion
- Payment volume
- SMS revenue
- Marketplace revenue placeholder
- Active users
- Bookings processed
- Top tenants
- Support ticket load
- Failed payments
- Provider issues
- Domain adoption
- Mobile app usage placeholder

Web:
- Executive Reports page.
- Date range filters.
- Plan filters.
- Country filters.
- Export PDF/Excel/CSV.
- Save report view placeholder.
- Scheduled report placeholder.

Mobile phone:
- Executive snapshot with key metrics only.

Mobile tablet:
- Reports dashboard with charts.

Acceptance criteria:
- General Office can understand business performance.
- Reports are accurate and exportable.

---

## Batch 131 - Audit Logs, Security & Admin Activity

Backend:
- Create or improve audit_logs.
- Track login, failed login, tenant changes, role changes, payment verification, wallet adjustment, payout approval, domain actions, provider settings changes, SMS credit allocation, impersonation/view-as-tenant, plan changes.
- Add filters and export.
- Add admin session list placeholder.
- Add suspicious activity flags.

Web:
- Audit Logs page.
- Security dashboard.
- Filters: user, tenant, module, action, date range, severity.
- Detail drawer with before/after values.
- Export logs.

Mobile phone:
- Critical security alerts and recent sensitive actions.

Mobile tablet:
- Audit log table plus detail.

Acceptance criteria:
- Sensitive General Office actions are traceable.
- Security visibility is strong.

---

## Batch 132 - Admin Command Palette & Global Search

Backend:
- Permission-aware search across tenants, users, payments, invoices, domains, support tickets, SMS sender IDs, subscriptions.

Web:
- Command palette shortcut.
- Global search topbar.
- Quick actions: find tenant, open payment, open ticket, verify domain, view failed payments, create support ticket, open provider health.
- Recent items.
- Favorite actions.

Mobile phone:
- Search screen and recent tenants/tickets/payments.

Mobile tablet:
- Command search overlay.

Acceptance criteria:
- Admins can quickly find and act on platform records.

---

## Batch 133 - Internal Notes, Tasks & Follow-Ups

Backend:
- Create internal_notes table.
- Create admin_tasks table.
- Link notes/tasks to tenant, payment, settlement, domain, support ticket, SMS sender ID.
- Add reminders/due dates, assignees, status.

Web:
- Internal notes panel on tenant/payment/domain/support pages.
- Task list.
- Assigned to me.
- Overdue tasks.
- Follow-up reminders.

Mobile phone:
- My tasks, add quick note, mark task done.

Mobile tablet:
- Task board.

Acceptance criteria:
- General Office can coordinate tenant support and operations.

---

## Batch 134 - Feature Flags, Plan Limits & Tenant Controls

Backend:
- Create feature_flags.
- Create tenant_feature_overrides.
- Create plan_limits.
- Limit examples: staff count, branch count, bookings/month, SMS features, custom domain, advanced reports, mobile access, payroll, POS, marketplace, AI assistant.
- APIs to check limits.

Web:
- Feature Flags page.
- Plan limits editor.
- Tenant override UI.
- Show which tenants have overrides.
- Disable/enable module per tenant.

Mobile:
- Read-only feature access status for admins.
- Alert when tenant hits limit.

Acceptance criteria:
- General Office can manage SaaS packaging without code changes.
- Plan limits are enforceable.

---

## Batch 135 - General Office Final Polish & Market Readiness

Tasks:
- Improve UI consistency.
- Improve table performance.
- Improve filters.
- Add saved views placeholder.
- Add export where needed.
- Add loading skeletons.
- Add empty states.
- Add error states.
- Add confirmation dialogs.
- Add audit logs to sensitive actions.
- Add permission checks.
- Improve mobile phone urgent workflows.
- Improve tablet layouts.
- Add README/docs for admin roles, tenant management, payment operations, support workflow, SMS operations, domain operations, incident workflow.
- Add tests for permission checks, tenant suspension, wallet adjustment, payment verification, domain block, SMS allocation, audit logs.

Acceptance criteria:
- General Office feels premium and operationally powerful.
- Super Admin can manage the full SaaS business.
- Support and finance teams can deliver better service.
- Mobile/tablet support urgent admin operations.
