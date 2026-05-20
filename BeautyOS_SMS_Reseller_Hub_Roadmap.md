# BeautyOS Bulk SMS Reseller Hub Roadmap

This file adds a full Bulk SMS reseller business module to BeautyOS.

The SaaS General Office connects to MNotify as the master SMS account.
Tenants can buy SMS packages from the platform.
General Office can allocate SMS credits, monitor usage, approve Sender IDs, and invoice tenants.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, billing, Paystack, MNotify, notification, role, and dashboard logic.

---

## Batch 51 — SMS Reseller Hub Foundation

Build the SMS Reseller Hub foundation.

Concept:
- General Office connects BeautyOS to MNotify.
- Tenants buy SMS packages from BeautyOS.
- BeautyOS supplies SMS credits to tenants.
- General Office monitors platform SMS balance, tenant usage, logs, errors, and delivery status.

Tasks:
- Add SMS reseller module to General Office.
- Add SMS wallet/balance system per tenant.
- Add platform/master SMS balance view.
- Add tenant SMS usage tracking.
- Add SMS transaction ledger.
- Add SMS allocation history.
- Add SMS package purchase history.

Database tables:
- sms_packages
- tenant_sms_wallets
- sms_wallet_transactions
- sms_sender_ids
- sms_sender_id_requests
- sms_delivery_logs
- sms_purchase_invoices
- sms_provider_balances
- sms_provider_sync_logs

Acceptance criteria:
- Each tenant has an SMS wallet.
- General Office can see tenant SMS balances.
- SMS usage deducts from tenant wallet.
- All SMS credit movements are logged.

---

## Batch 52 — MNotify Master Account Integration

Connect General Office to MNotify master account.

Tasks:
- Add MNotify master settings.
- Store API keys securely in environment/config.
- Fetch total SMS balance from MNotify.
- Sync provider balance to database.
- Show MNotify balance in General Office dashboard.
- Add provider health/status check.
- Add error handling for failed API calls.
- Add sync logs.

General Office should see:
- Total MNotify balance
- Last sync time
- Provider status
- Failed sync attempts
- Current provider errors

Acceptance criteria:
- General Office can view total SMS balance from MNotify.
- Provider balance sync is logged.
- Errors are visible and understandable.
- API keys are never exposed in UI.

---

## Batch 53 — SMS Packages CRUD

Build SMS package management for General Office.

General Office can CRUD SMS packages.

Package fields:
- Package name
- SMS credits
- Price
- Currency
- Bonus credits
- Validity period
- Active status
- Description
- Sort order

Seed default packages:
- Starter SMS Pack: 500 SMS
- Growth SMS Pack: 2,000 SMS
- Business SMS Pack: 5,000 SMS
- Pro SMS Pack: 10,000 SMS
- Enterprise SMS Pack: 50,000 SMS

Tasks:
- Create backend CRUD.
- Create General Office package management UI.
- Add active/inactive toggle.
- Add tenant-facing SMS package selection page.
- Add package purchase flow placeholder.

Acceptance criteria:
- General Office can manage SMS packages.
- Tenants can view available SMS packages.
- Default packages are seeded.

---

## Batch 54 — Tenant SMS Wallet & Low Balance Monitoring

Build tenant SMS wallet and low balance monitoring.

Tasks:
- Show tenant SMS wallet balance.
- Show tenant SMS usage.
- Show tenant low balance status.
- Allow tenant to set low balance alert threshold.
- General Office dashboard shows tenants with low SMS balance.
- Send low balance notification to tenant owner.
- Add tenant SMS usage summary.

Low balance logic:
- Default low balance threshold: 100 SMS
- Tenant can customize threshold
- General Office sees warning when balance is below threshold

Acceptance criteria:
- Tenants can see their SMS balance.
- General Office can see low-balance tenants.
- Low balance alerts are generated.

---

## Batch 55 — Tenant SMS Package Purchase with Paystack

Allow tenants to buy SMS packages.

Payment gateway:
- Paystack first
- Flutterwave later if existing abstraction supports it

Tasks:
- Tenant selects SMS package.
- Tenant proceeds to Paystack checkout.
- Create pending SMS purchase invoice.
- Verify Paystack payment.
- On successful payment:
  - Mark invoice paid
  - Credit tenant SMS wallet
  - Log wallet transaction
  - Send receipt
- On failed payment:
  - Mark invoice failed
  - Do not credit wallet

Invoice fields:
- Tenant
- Package
- Credits
- Amount
- Currency
- Status
- Payment reference
- Payment gateway
- Paid at

Acceptance criteria:
- Tenant can buy SMS package.
- Wallet is credited only after verified payment.
- Payment and wallet records are auditable.

---

## Batch 56 — General Office Manual SMS Credit Allocation

Allow General Office to buy/allocate SMS for tenants manually.

Use cases:
- Office purchases SMS for a tenant.
- Office gives bonus SMS.
- Office corrects wallet balance.
- Office sends invoice for tenant to pay.

Tasks:
- General Office can allocate SMS credits to a tenant.
- Allocation requires reason.
- Allocation is logged.
- General Office can create invoice for tenant.
- Tenant can pay invoice using Paystack.
- On payment, invoice is marked paid.
- If allocation is prepaid, credits are added immediately.
- If allocation requires payment first, credits are added after payment.

Allocation types:
- Manual credit
- Bonus credit
- Correction
- Invoice-based purchase

Acceptance criteria:
- General Office can safely credit tenants.
- All manual actions are logged.
- Invoice-based credits follow payment rules.

---

## Batch 57 — Sender ID Registration Workflow

Build Sender ID registration workflow.

Concept:
During onboarding, suggest an SMS Sender ID to tenant based on business name.
Tenant confirms or edits it.
Once confirmed, send request to MNotify to register Sender ID.
General Office can approve, reject, cancel, block, or review Sender ID requests.

Sender ID statuses:
- suggested
- pending_tenant_confirmation
- submitted_to_mnotify
- pending_provider_approval
- approved
- rejected
- cancelled
- blocked

Tasks:
- Suggest Sender ID during onboarding.
- Validate Sender ID format.
- Tenant confirms Sender ID.
- Submit Sender ID request to MNotify.
- Save provider reference if returned.
- Sync Sender ID status from MNotify where possible.
- General Office review screen.
- Admin actions:
  - approve
  - reject
  - cancel
  - block
  - request changes

Acceptance criteria:
- Sender ID is suggested during onboarding.
- Tenant can confirm Sender ID.
- Request is sent to MNotify.
- General Office can monitor and manage statuses.

---

## Batch 58 — SMS Sending Rules & Wallet Deduction

Connect actual SMS sending to tenant wallet.

Tasks:
- Before sending SMS, check tenant wallet balance.
- Block sending if balance is insufficient.
- Deduct SMS credits after successful accepted send.
- Log every SMS attempt.
- Track:
  - queued
  - sent
  - delivered
  - failed
  - rejected
- Store provider message ID.
- Store cost/credit count.
- Store recipient count.
- Store tenant ID.
- Store sender ID.
- Store message type.

Message types:
- OTP
- Booking confirmation
- Booking reminder
- Cancellation
- Payment alert
- Marketing
- Manual

Acceptance criteria:
- SMS cannot be sent without enough tenant balance.
- Successful sends deduct credits.
- Failed sends are logged.
- Wallet transactions are auditable.

---

## Batch 59 — SMS Logs, Delivery Reports & Error Monitoring

Build full SMS logs and monitoring.

General Office should see:
- All tenant SMS logs
- Delivery status
- Failed SMS
- Provider errors
- Tenant usage
- Sender ID usage
- SMS cost summary

Tenant should see:
- Own SMS logs
- Delivery status
- Failed SMS
- Balance deductions
- Usage by message type

Tasks:
- Create logs UI.
- Add filters:
  - tenant
  - sender ID
  - message type
  - delivery status
  - date range
  - recipient
- Add delivery report sync from MNotify where available.
- Add retry option for failed SMS where safe.
- Add export CSV.

Acceptance criteria:
- General Office can monitor all SMS activity.
- Tenants can monitor their own SMS activity.
- Errors are easy to diagnose.

---

## Batch 60 — SMS Reseller Analytics

Build SMS reseller analytics.

Charts:
- Total SMS sold
- Total SMS used
- Total SMS remaining across tenants
- Revenue from SMS packages
- Provider balance trend
- Tenant usage ranking
- Failed SMS trend
- Delivery success rate
- Low balance tenants
- Sender ID approval stats

Tasks:
- Add General Office SMS analytics dashboard.
- Add tenant SMS analytics dashboard.
- Add date range filters.
- Add package sales report.
- Add export.

Acceptance criteria:
- General Office can measure SMS reseller business performance.
- Tenants can understand their SMS usage.

---

## Batch 61 — SMS Reseller Final Hardening

Polish and secure the SMS reseller module.

Tasks:
- Verify wallet balance calculations.
- Prevent negative balances.
- Prevent duplicate payment crediting.
- Secure webhooks.
- Add audit logs.
- Add permissions.
- Add rate limits.
- Improve UI consistency.
- Improve empty/loading/error states.
- Add documentation.

Acceptance criteria:
- SMS reseller module is secure.
- Financial and wallet records are auditable.
- UI is clean and market-ready.