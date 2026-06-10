# BeautyOS Communications Roadmap

This roadmap builds the full communication system for BeautyOS.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, customer, staff, booking, SMS reseller, MNotify, email, payment, roles, marketing, reports, web, and mobile patterns.

---

## Feature Goal

Build a professional communication center for salons, spas, nail techs, barbers, and wellness businesses.

Communication channels:

- SMS
- Email
- WhatsApp
- In-app notifications
- Push notification placeholder for mobile

Communication audiences:

- Clients/customers
- Staff
- Tenant owners/managers
- General Office
- Leads/prospects
- Segmented customer groups

Use cases:

- Booking confirmations
- Booking reminders
- Reschedules
- Cancellations
- No-show follow-ups
- Payment requests
- Receipts
- Staff schedule alerts
- Staff time off notifications
- Promotions
- Birthday messages
- Win-back campaigns
- Loyalty messages
- Membership/package reminders
- Review requests
- Announcements
- Bulk campaigns
- Support messages
- Onboarding messages

---

## Cross-Platform Rule

Every batch must include:

1. Laravel backend API
2. Web frontend
3. Mobile phone UI
4. Mobile tablet UI

Mobile/tablet must support 60-80% of daily shop operations for tenants without laptops.

---

## Design Rules

Use:

- Clean modern SaaS UI
- Premium baby-pink BeautyOS accents
- Shadcn UI on web
- React Native mobile UI
- Lucide icons or matching mobile icons
- Clean inbox layouts
- Message composer
- Template picker
- Contact chips
- Segmentation filters
- Campaign cards
- Status badges
- Delivery timelines
- Empty states
- Loading skeletons
- Error states
- Analytics charts
- Mobile-first UX

---

# Batch 151 - Communications Center Foundation

Build the Communications Center foundation.

Backend:
- Create communication_channels table.
- Create communication_messages table.
- Create communication_threads table where needed.
- Create communication_recipients table.
- Create communication_templates table.
- Create communication_logs table.
- Add tenant-scoped APIs.
- Add permissions:
  - communications.view
  - communications.send
  - communications.bulk_send
  - communications.templates.manage
  - communications.settings.manage
  - communications.logs.view

Message fields:
- tenant_id
- channel: sms, email, whatsapp, in_app, push
- audience_type: client, staff, owner, manager, general_office, lead
- subject nullable
- body
- status: draft, queued, sending, sent, delivered, failed, cancelled
- scheduled_at nullable
- sent_at nullable
- created_by_user_id
- metadata json

Web:
- Create Communications section.
- Menu items:
  - Inbox
  - Compose
  - Campaigns
  - Automations
  - Templates
  - Contacts
  - Logs
  - Analytics
  - Settings
- Dashboard cards:
  - Messages sent
  - Delivery rate
  - Failed messages
  - SMS balance
  - WhatsApp status
  - Email status

Mobile phone:
- Communications home screen.
- Recent messages.
- Quick compose.
- Failed messages.

Mobile tablet:
- Communications dashboard with cards and recent messages.

Acceptance criteria:
- Communications module exists.
- Messages are tenant-scoped.
- UI is clean and ready for channel integrations.

---

# Batch 152 - Contact Lists, Segments & Consent

Build contact management for communication.

Backend:
- Add communication preferences to customers and staff.
- Track consent:
  - sms_opt_in
  - email_opt_in
  - whatsapp_opt_in
  - marketing_opt_in
  - transactional_allowed
- Create contact_segments table.
- Create segment_rules table.
- Create unsubscribe/opt-out logs.

Segment examples:
- All clients
- New clients
- VIP clients
- Inactive clients
- Birthday this month
- Clients with upcoming bookings
- Clients with no booking in 30 days
- Clients who bought specific service
- Clients with unpaid invoices
- Staff working today
- Staff on leave
- Staff by branch
- Staff by role

Web:
- Contacts page.
- Contact list with filters.
- Segment builder.
- Consent badges.
- Import placeholder.
- Export contacts.

Mobile phone:
- Contact search.
- Customer/staff communication preference view.
- Quick message action.

Mobile tablet:
- Contact list + segment detail split view.

Rules:
- Marketing messages require opt-in.
- Transactional messages can be sent where legally allowed.
- Respect opt-outs.

Acceptance criteria:
- Tenants can target the right audience.
- Consent is tracked and respected.

---

# Batch 153 - SMS Messaging with MNotify

Build SMS sending using MNotify and tenant SMS wallet.

Backend:
- Reuse MNotify integration if existing.
- Create SMSService.
- Send transactional SMS:
  - booking confirmation
  - booking reminder
  - cancellation
  - payment request
  - receipt
  - staff alert
- Send bulk SMS campaigns.
- Check tenant SMS balance before sending.
- Deduct SMS credits after accepted send.
- Store delivery logs.
- Track failed SMS.
- Support sender ID selection.
- Respect approved sender IDs.

Web:
- SMS compose page.
- Sender ID dropdown.
- Recipient/segment picker.
- Message character counter.
- Estimated SMS credit cost.
- Send now or schedule.
- SMS logs page.
- Failed SMS retry.

Mobile phone:
- Quick SMS compose.
- Send to client/staff.
- SMS status.

Mobile tablet:
- SMS campaign composer.

Acceptance criteria:
- Tenant can send SMS safely.
- Tenant SMS wallet is checked and deducted.
- Delivery logs are visible.

---

# Batch 154 - Email Messaging

Build email messaging.

Backend:
- Create EmailService using Laravel Mail.
- Support transactional emails:
  - welcome
  - booking confirmation
  - reminder
  - invoice
  - receipt
  - password reset handled by auth
  - staff schedule
  - time off approval
  - promotion
- Add email templates.
- Add queue jobs.
- Track email delivery status where provider supports it.
- Add unsubscribe link for marketing emails.
- Add tenant branding to emails.

Web:
- Email composer.
- Rich text editor or simple formatted editor.
- Template picker.
- Preview email.
- Send test email.
- Schedule email.
- Email logs.

Mobile phone:
- Quick email from customer/staff profile.
- View email history.

Mobile tablet:
- Email composer with preview.

Acceptance criteria:
- Tenant can send branded emails.
- Transactional emails are queued.
- Marketing opt-outs are respected.

---

# Batch 155 - WhatsApp Messaging Foundation

Build WhatsApp communication foundation.

Backend:
- Add WhatsApp provider abstraction:
  - WhatsAppCloudApiProvider placeholder
  - TwilioWhatsAppProvider placeholder
  - Manual WhatsApp link fallback
- Store provider settings.
- Support WhatsApp message templates.
- Support click-to-WhatsApp fallback using wa.me links.
- Track WhatsApp logs.
- Add permissions.

Web:
- WhatsApp settings page.
- WhatsApp status card.
- WhatsApp compose page.
- Template picker.
- Open WhatsApp fallback button.
- Logs page.

Mobile phone:
- Open WhatsApp chat from client/staff profile.
- Send template or open native WhatsApp.
- Show WhatsApp history/logs.

Mobile tablet:
- WhatsApp messaging panel.

Important:
- Do not assume WhatsApp Business API approval is already available.
- Build fallback first, then provider integration.

Acceptance criteria:
- Tenants can use WhatsApp fallback immediately.
- System is ready for WhatsApp Business API integration.

---

# Batch 156 - Booking Communication Automations

Build booking-related automations.

Automations:
- Booking created
- Booking confirmed
- Booking reminder 24 hours before
- Booking reminder 2 hours before
- Booking rescheduled
- Booking cancelled
- Appointment completed
- No-show follow-up
- Review request after completion

Backend:
- Create communication_automations table.
- Create automation_rules table.
- Create scheduled jobs.
- Add per-tenant automation settings.
- Allow channel selection per automation:
  - SMS
  - Email
  - WhatsApp
  - In-app
- Support template variables:
  - customer_name
  - business_name
  - service_name
  - staff_name
  - booking_date
  - booking_time
  - booking_link
  - cancel_link
  - payment_link

Web:
- Automations page.
- Toggle automations.
- Select channels.
- Edit templates.
- Send test message.
- Preview variables.

Mobile phone:
- Automation summary.
- Toggle key automations.
- View upcoming scheduled messages.

Mobile tablet:
- Automation rule editor.

Acceptance criteria:
- Booking communications can run automatically.
- Tenants can control channels and templates.

---

# Batch 157 - Staff Communication Automations

Build staff communication features.

Use cases:
- New appointment assigned
- Appointment rescheduled
- Appointment cancelled
- Daily schedule summary
- Time off request submitted
- Time off approved/rejected
- Payroll ready
- Shift reminder
- Internal announcement

Backend:
- Add staff notification preferences.
- Add staff automation rules.
- Add in-app notifications.
- Add SMS/email/WhatsApp sending where enabled.
- Respect staff role and branch.

Web:
- Staff communication settings.
- Internal announcement composer.
- Staff group targeting:
  - all staff
  - branch staff
  - role-based
  - specific staff
- Staff notification logs.

Mobile phone:
- Staff notifications screen.
- Daily schedule alert.
- Internal announcements.

Mobile tablet:
- Staff communication panel.

Acceptance criteria:
- Staff are informed about schedules and changes.
- Tenant admin can send internal messages.

---

# Batch 158 - Promotions & Campaign Builder

Build promotions and campaign management.

Campaign types:
- SMS campaign
- Email campaign
- WhatsApp campaign
- Multi-channel campaign

Campaign goals:
- Discount promotion
- Birthday offer
- Win-back inactive clients
- New service launch
- Holiday campaign
- Membership upsell
- Package promotion
- Gift card campaign
- Review request campaign

Backend:
- Create campaigns table.
- Create campaign_recipients table.
- Create campaign_events table.
- Campaign statuses:
  - draft
  - scheduled
  - sending
  - sent
  - paused
  - cancelled
  - failed
- Add scheduling.
- Add segmentation.
- Add coupon linking.
- Add campaign performance tracking.

Web:
- Campaigns page.
- Campaign builder:
  - choose audience
  - choose channel
  - choose template
  - attach coupon
  - schedule/send
  - preview
- Campaign detail analytics.

Mobile phone:
- Campaign list.
- Simple campaign creation from template.
- Pause/cancel campaign.

Mobile tablet:
- Campaign builder with preview.

Acceptance criteria:
- Tenants can run marketing campaigns.
- Campaigns respect opt-in and SMS balance.

---

# Batch 159 - Communication Templates & Personalization

Build reusable templates.

Template categories:
- Booking
- Payment
- Staff
- Marketing
- Review
- Birthday
- Win-back
- Membership
- Gift card
- Support
- General announcement

Backend:
- Template CRUD.
- System templates.
- Tenant custom templates.
- Variables system.
- Preview rendering.
- Template versioning placeholder.

Variables:
- customer_name
- staff_name
- business_name
- branch_name
- service_name
- appointment_date
- appointment_time
- amount
- payment_link
- invoice_number
- coupon_code
- review_link
- booking_link

Web:
- Templates page.
- Template editor.
- Variable picker.
- Preview panel.
- Duplicate template.
- Restore default template.

Mobile phone:
- Template picker.
- Preview.

Mobile tablet:
- Editor + preview layout.

Acceptance criteria:
- Tenants can personalize messages without typing from scratch.
- Variables render correctly.

---

# Batch 160 - Inbox, Threads & Customer Conversation Timeline

Build unified communication history.

Backend:
- Create conversation timeline API.
- Group messages by customer/staff where useful.
- Store inbound messages placeholder.
- Link messages to customer, booking, invoice, payment, or support ticket.
- Add read/unread status.

Web:
- Inbox page.
- Conversation list.
- Message timeline.
- Filters:
  - unread
  - failed
  - customer
  - staff
  - channel
  - booking
- Customer profile > Communication tab.
- Staff profile > Communication tab.

Mobile phone:
- Inbox list.
- Conversation timeline.
- Quick reply where provider supports it.

Mobile tablet:
- Inbox split view.

Acceptance criteria:
- Tenant can see all communication history in one place.
- Conversations are linked to business records.

---

# Batch 161 - Communication Analytics

Build analytics for communication.

Metrics:
- Total messages sent
- SMS delivery rate
- Email delivery/open placeholder
- WhatsApp sent rate
- Failed messages
- Campaign conversion
- Booking reminders sent
- No-show reduction estimate
- Revenue from campaigns
- SMS credits used
- Cost per campaign
- Top performing campaigns
- Opt-out rate

Backend:
- Aggregate communication analytics.
- Date filters.
- Channel filters.
- Campaign filters.
- Export reports.

Web:
- Communications Analytics page.
- Cards and charts.
- Campaign performance table.
- Delivery error breakdown.
- Revenue attribution placeholder.

Mobile phone:
- Communication performance summary.
- Failed messages alert.

Mobile tablet:
- Analytics dashboard.

Acceptance criteria:
- Tenants understand message performance.
- General Office can see communication volume across tenants where permitted.

---

# Batch 162 - General Office Communication Oversight

Build General Office oversight for platform-wide communication.

Backend:
- Aggregate tenant communication usage.
- SMS usage by tenant.
- Email volume.
- WhatsApp provider status.
- Campaign abuse/risk indicators.
- Opt-out and complaint tracking placeholder.
- Sender ID approvals linked to SMS module.

Web:
- General Office > Communications.
- Cards:
  - Total SMS sent
  - Email sent
  - WhatsApp messages
  - Failed messages
  - Top tenants by usage
  - Low SMS balance tenants
  - Pending sender IDs
- Tables:
  - tenant communication usage
  - failed deliveries
  - high complaint/opt-out tenants
  - campaign volume
- Actions:
  - view tenant logs
  - suspend marketing send
  - approve sender ID
  - send platform announcement

Mobile phone:
- Failed delivery alerts.
- Pending sender ID approvals.
- High-risk tenant communication alert.

Mobile tablet:
- Communication operations dashboard.

Acceptance criteria:
- General Office can monitor and support tenant communications.
- Abuse/risk can be controlled.

---

# Batch 163 - Communication Compliance, Quiet Hours & Opt-Out

Build communication safety and compliance.

Backend:
- Add quiet hours settings per tenant.
- Add country/timezone-aware scheduling.
- Add opt-out handling.
- Add unsubscribe links.
- Add STOP keyword placeholder for SMS.
- Add marketing consent checks.
- Add rate limits.
- Add suppression list.
- Add blocked recipients list.
- Add compliance audit logs.

Rules:
- Transactional messages can bypass quiet hours only if configured and legally allowed.
- Marketing messages must respect quiet hours and opt-in.
- Do not send to opted-out recipients.
- Do not exceed tenant campaign limits.

Web:
- Compliance settings page.
- Quiet hours editor.
- Suppression list.
- Opt-out logs.
- Rate limit settings where allowed.

Mobile phone:
- View compliance status.
- Manage simple opt-out on customer profile.

Mobile tablet:
- Compliance settings layout.

Acceptance criteria:
- System avoids spamming clients.
- Tenants have safer marketing tools.

---

# Batch 164 - Communication Settings & Provider Health

Build provider settings and health monitoring.

Providers:
- MNotify SMS
- Email provider
- WhatsApp provider
- Push provider placeholder

Backend:
- Provider health checks.
- Channel enable/disable settings.
- Tenant channel preferences.
- Default sender name/email.
- Approved sender IDs.
- WhatsApp connection status.
- Email domain verification placeholder.

Web:
- Communication Settings page.
- Channel cards:
  - SMS
  - Email
  - WhatsApp
  - Push
- Provider status badges.
- Test message action.
- Sender settings.
- Branding settings for emails.

Mobile phone:
- Channel status.
- Test SMS/email action if permitted.

Mobile tablet:
- Settings cards grid.

Acceptance criteria:
- Tenants can see what channels are active.
- Provider problems are easy to identify.

---

# Batch 165 - Communication Final Polish & Market Readiness

Polish the communications module.

Tasks:
- Improve UI consistency.
- Improve mobile phone experience.
- Improve tablet experience.
- Add loading states.
- Add empty states.
- Add error states.
- Add permission checks.
- Add audit logs.
- Add tests:
  - tenant isolation
  - consent checks
  - SMS wallet deduction
  - template rendering
  - automation scheduling
  - campaign sending
  - quiet hours
  - opt-out prevention
  - staff notifications
  - payment request notifications
- Update documentation:
  - SMS setup
  - Email setup
  - WhatsApp setup
  - Campaign best practices
  - Compliance guidelines
  - Template variables
  - Automation rules

Acceptance criteria:
- Communications module is market-ready.
- Tenants can message clients and staff professionally.
- Promotions and automations work safely.
- Web, phone, and tablet experiences are polished.
