# SaaS Church Management System – Groups / Ministries Module Implementation Prompt

Use this prompt in Claude or your coding assistant.

---

## Context

You are working inside an existing **Next.js + Laravel SaaS Church Management System**.

Do **not** rebuild from scratch.  
Continue from the existing architecture.

This SaaS system already includes:

- Multi-tenant church setup
- General Office / Super Admin
- Church packages
- Subscriptions
- Tenant registration
- Package selection
- Church onboarding
- Tenant dashboard

Now implement a simple, customizable **Groups / Ministries / Fellowships** module.

---

## Important UX Instruction

Users are complaining that the app looks and feels complex.

So this module must be:

- Simple
- Clean
- Easy to understand
- Easy to set up
- Not overwhelming
- Mobile responsive
- Friendly for non-technical church staff

Use progressive disclosure:

- Show only the most important actions first
- Hide advanced options under “More options”
- Use cards instead of complex tables where possible
- Use guided setup for first-time churches

---

# Goal

Churches should be able to create and manage groups such as:

- YPG
- YAF
- Men’s Fellowship
- Women’s Fellowship
- Church Choir
- Youth Ministry
- Prayer Team
- Any custom church group

Because this is a SaaS system, not every church has the same structure.

The module must be optional and customizable per church/tenant.

---

# 1. Group Setup

## Route

```txt
/dashboard/groups
```

## Features

Church Admin can:

- Enable or disable the Groups module
- Create custom groups
- Edit group name
- Add description
- Add logo/icon
- Set meeting day
- Set meeting time
- Set meeting location
- Set whether group collects dues
- Set dues amount
- Set dues frequency

## Dues Frequency Options

- Weekly
- Monthly
- Quarterly
- Yearly
- Custom

## Group Leadership

Each group should support:

- Group leader
- Assistant leader
- Officers
- Members

Default group roles:

- President
- Vice President
- Secretary
- Financial Secretary
- Treasurer
- Organizer
- Choir Director
- Member

Church Admin should be able to add custom group roles.

---

# 2. Assign Members to Groups

## Features

Church Admin can:

- Add member to one or more groups
- Assign member role inside group
- Set member group status
- Bulk add members to a group
- Search members
- Filter members

## Member Group Status

- Active
- Inactive
- Visitor
- Alumni

## Filters

Allow filtering by:

- Branch / campus
- Gender
- Age range
- Ministry
- Membership status

## UX Requirement

Use simple member cards where possible instead of complex tables.

---

# 3. Group Leader Dashboard

## Route

```txt
/dashboard/group-leader
```

Group leaders can:

- View only their assigned group
- View group members
- Add meeting attendance
- Submit dues report
- Submit group activity report
- Request funds from church finance
- View approved/rejected fund requests
- Send message to group members if permission is enabled

## Dashboard Cards

Show:

- Today’s meeting
- Members count
- Dues collected this month
- Pending finance request
- Quick actions

## Quick Actions

- Mark Attendance
- Record Dues
- Submit Report
- Request Funds
- Message Members

Keep this dashboard simple and focused.

---

# 4. Group Dues

## Features

Groups can collect dues from members.

The system should:

- Track member dues
- Record dues payment
- Mark dues paid/unpaid
- Auto-generate dues report
- Send dues report to church finance/accounting section
- Allow Finance Officer to review and approve submitted dues report
- Convert approved dues into church income

## Payment Methods

- Cash
- Mobile money
- Bank transfer
- Card
- Other

## Dues Report Details

Each dues report should include:

- Group
- Reporting period
- Total expected
- Total collected
- Total outstanding
- List of members who paid
- List of members owing
- Submitted by
- Approved by finance officer
- Date submitted
- Date approved

---

# 5. Group Fund Requests

Groups can request money from the church finance section.

## Features

Group leader can create a fund request with:

- Group
- Amount requested
- Reason / purpose
- Supporting note
- Optional attachment

## Finance Officer Actions

Finance Officer can:

- Approve request
- Reject request
- Request more information

## If Approved

The system should:

- Create expense record or pending disbursement
- Notify group leader by email
- Notify group leader by SMS if SMS is enabled
- Send in-app notification

## If Rejected

The system should:

- Notify group leader
- Include rejection reason

---

# 6. Bulk Email / SMS by Group

## Route

```txt
/dashboard/communications/groups
```

Church Admin can send messages to groups.

## Features

Admin can:

- Select one group
- Select multiple groups
- Select recipient type
- Send Email
- Send SMS
- Save message as template
- View delivery status

## Recipient Options

- All group members
- Group officers only
- Members with unpaid dues
- Active members only

## Important

Use the existing communication system if available.

Do not duplicate SMS/email logic.

Create group recipient filters and connect them to the existing messaging system.

---

# 7. Finance Integration

Group dues and funds must connect to church finance.

## Finance Routes

```txt
/dashboard/finance/group-dues
/dashboard/finance/group-fund-requests
```

## Finance Officer Dashboard Should Show

- Pending dues reports
- Pending group fund requests
- Approved dues income
- Approved group expenses/disbursements

## Approved Dues

When finance approves dues report:

- Create income record
- Attach income to correct fund/category
- Link income record to the dues report

## Approved Fund Request

When finance approves a fund request:

- Create expense or disbursement record
- Link expense to the fund request
- Notify group leader

---

# 8. SaaS Customization

Because every church is different, tenant settings must allow:

- Enable/disable Groups module
- Rename “Groups” to:
  - Ministries
  - Fellowships
  - Departments
  - Auxiliaries
  - Societies
  - Custom name
- Enable/disable dues
- Enable/disable group fund requests
- Enable/disable group leader dashboard
- Enable/disable group bulk messaging
- Customize officer role names

---

# 9. Database Tables

Create or update these tables:

```txt
groups
group_members
group_roles
group_meetings
group_attendance
group_dues_settings
group_dues_payments
group_dues_reports
group_dues_report_items
group_fund_requests
group_message_logs
tenant_group_settings
```

Every table must include:

- tenant_id
- created_by where needed
- updated_by where needed
- indexes for tenant_id

## Relationships

- Tenant has many groups
- Group has many members
- Member belongs to many groups
- Group has many roles
- Group has many dues payments
- Group has many fund requests
- Group leader is a user/member
- Dues reports connect to finance income
- Approved fund requests connect to finance expense/disbursement

---

# 10. Backend API

Create Laravel APIs.

## Groups

```txt
GET /api/groups
POST /api/groups
GET /api/groups/{id}
PUT /api/groups/{id}
DELETE /api/groups/{id}
```

## Group Members

```txt
GET /api/groups/{id}/members
POST /api/groups/{id}/members
POST /api/groups/{id}/members/bulk
PUT /api/group-members/{id}
DELETE /api/group-members/{id}
```

## Group Roles

```txt
GET /api/group-roles
POST /api/group-roles
PUT /api/group-roles/{id}
DELETE /api/group-roles/{id}
```

## Dues

```txt
GET /api/groups/{id}/dues
POST /api/groups/{id}/dues/payment
POST /api/groups/{id}/dues/report
GET /api/finance/group-dues/reports
POST /api/finance/group-dues/reports/{id}/approve
POST /api/finance/group-dues/reports/{id}/reject
```

## Fund Requests

```txt
GET /api/group-fund-requests
POST /api/group-fund-requests
POST /api/finance/group-fund-requests/{id}/approve
POST /api/finance/group-fund-requests/{id}/reject
POST /api/finance/group-fund-requests/{id}/request-info
```

## Group Messaging

```txt
POST /api/groups/messages/send
GET /api/groups/messages/logs
```

## Settings

```txt
GET /api/tenant/group-settings
PUT /api/tenant/group-settings
```

---

# 11. Frontend Pages

## Admin Pages

```txt
/dashboard/groups
/dashboard/groups/new
/dashboard/groups/[id]
/dashboard/groups/[id]/members
/dashboard/groups/[id]/dues
/dashboard/groups/[id]/reports
/dashboard/groups/settings
```

## Group Leader Pages

```txt
/dashboard/group-leader
/dashboard/group-leader/members
/dashboard/group-leader/attendance
/dashboard/group-leader/dues
/dashboard/group-leader/fund-requests
```

## Finance Pages

```txt
/dashboard/finance/group-dues
/dashboard/finance/group-fund-requests
```

## Communications Page

```txt
/dashboard/communications/groups
```

---

# 12. UI Components

Create reusable components:

```txt
GroupCard
GroupMemberCard
GroupRoleBadge
DuesStatusBadge
FundRequestStatusBadge
SimpleStatsCard
EmptyState
GuidedSetupCard
GroupSettingsPanel
MemberPicker
BulkMemberSelector
MessageComposer
ApprovalTimeline
```

---

# 13. Simple UX Rules

Follow these rules strictly:

- Default page should show cards, not complex tables
- Use tabs only when needed
- Use clear action labels:
  - Add Group
  - Add Members
  - Record Dues
  - Submit Report
  - Request Funds
  - Send Message
- Hide advanced settings under “More options”
- Show setup checklist for first-time churches
- Use empty states with helpful text
- Keep forms short
- Use step-by-step setup for groups
- Avoid too many dashboard menu items
- Group related features under one “Groups” menu

---

# 14. Permissions

Add permissions.

## Church Admin

Can:

- Manage all groups
- Assign members
- Send group messages
- View group reports
- Configure group settings

## Group Leader

Can:

- View assigned group only
- Manage group attendance
- Submit dues report
- Request funds
- View group members

## Financial Secretary

Can:

- Record dues
- Prepare dues reports

## Finance Officer

Can:

- Approve dues reports
- Approve/reject fund requests
- Convert approved dues into income
- Convert approved requests into expense/disbursement

## Member

Can:

- View own group membership
- View own dues status if member portal exists

---

# 15. Notifications

Send notifications for:

- Member added to group
- Dues report submitted
- Dues report approved
- Dues report rejected
- Fund request submitted
- Fund request approved
- Fund request rejected
- Group message sent

Use existing notification/email/SMS system if available.

---

# 16. Testing

Test these flows:

- Church can enable Groups module
- Church can rename Groups to Ministries/Fellowships
- Admin can create YPG, YAF, Men’s, Women’s, Choir
- Admin can assign members to groups
- Leader can only see own group
- Group can submit dues report
- Finance can approve dues report
- Approved dues appears in church income
- Group can request funds
- Finance can approve/reject request
- Admin can send bulk SMS/email by group
- Tenant A cannot see Tenant B groups

---


---

# 17. WhatsApp Messaging Integration

Churches should be able to connect their own WhatsApp Business number so messages can be sent through WhatsApp.

Use the official WhatsApp Business Platform / Cloud API where possible.

Reference requirements:
- WhatsApp messages should be sent through a connected WhatsApp Business phone number.
- Store WhatsApp Business Account ID, phone number ID, display phone number, connection status, webhook status, and token securely.
- Use webhooks for delivery status updates and incoming message events.
- Follow provider rate limits and retry rules.

## Tenant WhatsApp Settings

Create a tenant-level WhatsApp setup page.

Route:

```txt
/dashboard/settings/whatsapp
```

Church Admin can:

- Enable/disable WhatsApp messaging
- Connect WhatsApp Business number
- View connected number
- View connection status
- Send test WhatsApp message
- Disconnect WhatsApp number
- Configure who can send WhatsApp messages
- View message usage

## Recommended Connection Options

Support one or both approaches:

### Option A: Meta WhatsApp Cloud API

Fields/settings:

- WhatsApp Business Account ID
- Phone Number ID
- Display phone number
- Access token
- Webhook verify token
- App ID
- App Secret
- Business ID
- Connection status

### Option B: External Provider Adapter

Allow future support for providers like:

- Twilio WhatsApp
- 360dialog
- Africa's Talking if WhatsApp support is available
- Other WhatsApp BSP providers

Use a provider adapter pattern so the app is not locked to only one vendor.

## Database Tables

Create:

```txt
tenant_whatsapp_settings
whatsapp_message_templates
whatsapp_message_logs
whatsapp_webhook_events
```

### tenant_whatsapp_settings fields

Include:

- id
- tenant_id
- provider
- business_account_id
- phone_number_id
- display_phone_number
- access_token encrypted
- app_id nullable
- app_secret encrypted nullable
- webhook_verify_token encrypted
- status: disconnected, pending, connected, failed
- is_enabled
- last_verified_at
- created_by
- updated_by
- created_at
- updated_at

### whatsapp_message_templates fields

Include:

- id
- tenant_id
- name
- category
- language
- body
- provider_template_id nullable
- status: draft, pending_approval, approved, rejected
- created_by
- updated_by
- created_at
- updated_at

### whatsapp_message_logs fields

Include:

- id
- tenant_id
- sender_user_id
- recipient_type
- recipient_id nullable
- recipient_phone
- message_type
- message_body
- template_id nullable
- provider_message_id nullable
- status: queued, sent, delivered, read, failed
- error_message nullable
- sent_at nullable
- delivered_at nullable
- read_at nullable
- failed_at nullable
- created_at
- updated_at

### whatsapp_webhook_events fields

Include:

- id
- tenant_id nullable
- provider
- event_type
- provider_message_id nullable
- payload json
- processed_at nullable
- created_at
- updated_at

## Backend API

Create APIs:

```txt
GET /api/tenant/whatsapp/settings
PUT /api/tenant/whatsapp/settings
POST /api/tenant/whatsapp/connect
POST /api/tenant/whatsapp/disconnect
POST /api/tenant/whatsapp/test-message
GET /api/tenant/whatsapp/message-logs
GET /api/tenant/whatsapp/templates
POST /api/tenant/whatsapp/templates
PUT /api/tenant/whatsapp/templates/{id}
DELETE /api/tenant/whatsapp/templates/{id}
POST /api/webhooks/whatsapp
GET /api/webhooks/whatsapp
```

## Messaging Integration

Update the existing communication system so Church Admin can choose channels:

- Email
- SMS
- WhatsApp
- In-app notification

WhatsApp should work for:

- Group messages
- Member announcements
- Visitor follow-up
- Birthday greetings
- Event reminders
- Dues reminders
- Finance approval notifications
- Group fund request updates

## Group WhatsApp Messaging

Update group messaging page:

Route:

```txt
/dashboard/communications/groups
```

Add WhatsApp as a channel.

Admin can send WhatsApp messages to:

- All group members
- Group officers only
- Active members only
- Members with unpaid dues
- Selected members only

Before sending:

- Validate member has phone number
- Format phone number with country code
- Show recipients without valid WhatsApp phone numbers
- Allow admin to continue or cancel

## WhatsApp Message Rules

Implement safe messaging rules:

- Use templates for official bulk/notification messages where provider requires it
- Use normal session messages only when allowed
- Track delivery status
- Queue bulk messages
- Rate limit sending
- Retry failed messages safely
- Log every message
- Respect tenant package limits
- Respect opt-out preferences

## Package Feature Control

Add WhatsApp feature gating.

Packages may define:

- WhatsApp enabled: yes/no
- Monthly WhatsApp message limit
- WhatsApp templates allowed
- Bulk WhatsApp allowed
- Group WhatsApp allowed

If church package does not include WhatsApp:

- Show upgrade prompt
- Disable WhatsApp sending
- Keep settings page visible but locked

## Permissions

Add permissions:

Church Admin:

- Connect WhatsApp
- Configure WhatsApp settings
- Send WhatsApp messages
- View WhatsApp logs

Group Leader:

- Send WhatsApp to assigned group only if enabled by Church Admin

Finance Officer:

- Send WhatsApp finance notifications if enabled

Super Admin / General Office:

- View which tenants have WhatsApp connected
- Disable WhatsApp for a tenant if needed
- View WhatsApp usage summary, not private message content unless system policy allows

## Frontend Components

Create:

```txt
WhatsAppSettingsCard
WhatsAppConnectForm
WhatsAppStatusBadge
WhatsAppTestMessageModal
WhatsAppUsageCard
ChannelSelector
InvalidPhoneRecipientsList
WhatsAppMessageLogTable
```

## UI/UX Requirements

Keep WhatsApp setup simple.

Use a guided setup:

Step 1:
Choose provider

Step 2:
Enter WhatsApp credentials

Step 3:
Verify connection

Step 4:
Send test message

Step 5:
Start using WhatsApp in communications

Use friendly language:

- “Connect WhatsApp”
- “Send test message”
- “WhatsApp is connected”
- “Some members do not have valid phone numbers”

Avoid showing too many technical API fields unless user clicks “Advanced setup”.

## Security Requirements

- Encrypt all tokens and secrets
- Never expose access tokens to frontend
- Validate webhook signatures where provider supports it
- Store webhook verify token securely
- Use tenant-aware queries
- Prevent Tenant A from sending through Tenant B WhatsApp number
- Log all send actions
- Respect user communication preferences

## Testing

Test:

- Tenant can connect WhatsApp number
- Tenant can send test message
- Admin can send WhatsApp to one group
- Admin can send WhatsApp to multiple groups
- Invalid phone numbers are detected
- WhatsApp logs update after sending
- Webhook delivery status updates message logs
- Package without WhatsApp cannot send
- Tenant A cannot access Tenant B WhatsApp settings
- Group leader can only message assigned group if permission is enabled

---

# Updated Final Instruction

The Groups module must support Email, SMS, WhatsApp, and in-app notifications.

Keep messaging simple for church admins.

Use existing communication architecture where possible.

Do not duplicate logic for each channel; create a clean channel-based messaging service.

# Final Instruction

Keep the app simple.

Do not make the UI feel like accounting software.

Use clean, friendly, guided screens.

Generate complete working code.

Explain files created and modified before coding.
