# BeautyOS Tenant MTN Mobile Money Features Roadmap

This roadmap builds MTN Mobile Money features for each tenant in BeautyOS.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, payment request, wallet, settlement, booking, invoice, POS, SMS reseller, role, dashboard, notification, and mobile app patterns.

---

## Important Product Rule

BeautyOS should show each tenant their BeautyOS Wallet Balance by default.

Do not promise to show a tenant owner's personal MTN MoMo wallet balance unless MTN officially approves that use case for your production account and market.

For most tenants, show:

- BeautyOS available balance
- Pending balance
- Total collected
- Total fees
- Total settled
- Settlement history

For enterprise tenants that connect their own MTN MoMo merchant/API account, optionally show:

- Connected MTN merchant/account balance
- Last synced time
- Connection status
- Provider sync errors

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
- Premium baby-pink BeautyOS theme
- Shadcn UI on web
- React Native mobile UI
- Lucide icons or matching mobile icons
- Clean wallet cards
- Status badges
- Timeline views
- Transaction tables
- Charts where useful
- Empty states
- Loading skeletons
- Error states
- Toast feedback

---

## Feature Goal

Build complete MTN MoMo support for tenants.

Each tenant should be able to:

- Use BeautyOS Payments with the platform MTN MoMo account
- Optionally connect their own MTN MoMo merchant account if allowed
- Request MTN MoMo payment from customers
- View BeautyOS wallet balance
- View connected MTN merchant balance if they use their own account
- View payment requests
- View successful and failed payments
- View wallet transactions
- Request settlement/payout
- View settlement history
- View MTN connection status
- See gateway health
- Receive payment notifications
- Use these flows on web, phone, and tablet

General Office should be able to:

- Configure platform MTN MoMo account
- Monitor all tenant MTN payment activity
- View platform MTN balance if supported
- View tenant wallet balances
- View settlement liabilities
- Approve payouts
- Enable or disable tenant-owned MTN gateway
- Review connected MTN accounts
- View provider errors and logs
- Audit all payment activity

---

## MTN MoMo Concepts

Main products/features to support:

1. Collections / Request to Pay
   - Used to collect money from customers.

2. Transaction Status
   - Used to check whether a request is pending, successful, or failed.

3. Callback/Webhook
   - MTN notifies BeautyOS of transaction result.

4. Account Balance
   - For platform account or tenant-owned merchant account, where officially supported.

5. Account Holder Info / Validation
   - Optional. Used to validate phone/account holder where supported.

6. Refund/Reversal
   - Optional advanced feature. Add structure now, implement when approved.

7. Disbursement / Transfer
   - Optional advanced feature. Used for automated settlement if approved.

---

# Batch 102 - Tenant Payment Mode Foundation

Build tenant payment mode settings.

Payment modes:

- platform_account
- tenant_own_account
- disabled

Backend:
- Create or update tenant_payment_settings table.
- Fields:
  - id
  - tenant_id
  - mode
  - default_gateway
  - mtn_momo_enabled
  - paystack_enabled
  - flutterwave_enabled
  - settlement_schedule: manual, daily, weekly, monthly
  - settlement_method: momo, bank, cash, other
  - settlement_account_name
  - settlement_account_number
  - settlement_provider
  - settlement_notes
  - is_payment_enabled
  - approved_by_user_id nullable
  - approved_at nullable
  - created_at
  - updated_at

APIs:
- Get tenant payment settings
- Update tenant payment settings
- Enable/disable payment collection
- Set default gateway
- Set settlement details

Web:
- Tenant Settings > Payments page.
- Add payment mode cards:
  - Use BeautyOS Payments
  - Connect My Own Gateway
  - Disable Online Payments
- Add settlement details form.
- Add gateway status badges.

Mobile phone:
- Payment settings summary.
- Settlement details view/edit for tenant owner.
- Gateway status.

Mobile tablet:
- Two-column payment settings layout.

Acceptance criteria:
- Tenant has clear payment mode.
- Most tenants can use BeautyOS platform account.
- Enterprise tenants can be allowed to use own gateway later.

---

# Batch 103 - MTN Provider Accounts

Build MTN provider account management.

Backend:
- Create payment_provider_accounts table.
- Fields:
  - id
  - tenant_id nullable
  - provider: mtn_momo, paystack, flutterwave
  - account_type: platform, tenant
  - environment: sandbox, production
  - country
  - currency
  - api_user encrypted nullable
  - api_key encrypted nullable
  - subscription_key encrypted nullable
  - target_environment
  - callback_host
  - status: not_configured, pending, connected, failed, disabled, blocked
  - last_health_check_at
  - last_successful_token_at
  - last_balance_sync_at
  - last_error
  - created_at
  - updated_at

Rules:
- General Office manages platform account.
- Tenant-owned account only available if tenant plan/permission allows.
- Secrets must be encrypted or stored in env for platform account.
- Never expose full secrets in UI.

APIs:
- General Office get platform MTN settings/status.
- General Office update platform MTN settings.
- Tenant request own MTN connection.
- Tenant update own MTN settings if allowed.
- Health check provider account.

Web:
- General Office > Payment Providers > MTN MoMo.
- Tenant > Payment Settings > MTN MoMo connection.
- Show connection status, environment, country, currency, last sync, last error.
- Mask secrets.

Mobile phone:
- Tenant MTN connection status.
- Enterprise tenant can view setup state.

Mobile tablet:
- MTN provider account detail panel.

Acceptance criteria:
- BeautyOS supports platform MTN account and tenant-owned MTN accounts.
- Secrets are protected.
- Connection status is visible.

---

# Batch 104 - Tenant BeautyOS Wallet

Build tenant wallet ledger for payments collected through BeautyOS.

Backend:
- Create tenant_wallets table.
- Fields:
  - id
  - tenant_id
  - currency
  - available_balance
  - pending_balance
  - total_collected
  - total_fees
  - total_settled
  - total_refunded
  - status
  - created_at
  - updated_at

- Create tenant_wallet_transactions table.
- Fields:
  - id
  - tenant_id
  - wallet_id
  - payment_request_id nullable
  - settlement_id nullable
  - type: payment_collected, platform_fee, gateway_fee, settlement_pending, settlement_paid, refund, adjustment, reversal
  - direction: credit, debit
  - amount
  - balance_before
  - balance_after
  - reference
  - description
  - metadata json
  - created_by_user_id nullable
  - created_at

Rules:
- Never update wallet balance without a ledger transaction.
- Prevent negative available balance unless explicitly allowed by admin permission.
- Wallet changes must be idempotent.
- Successful payment increases pending balance first.
- After settlement window clears, move pending to available if needed.

APIs:
- Get tenant wallet summary
- Get wallet transactions
- Export wallet transactions
- General Office adjust wallet with permission
- General Office view all tenant wallet balances

Web:
- Tenant Payments > Wallet page.
- Cards:
  - Available Balance
  - Pending Balance
  - Total Collected
  - Total Fees
  - Total Settled
- Transaction table.
- Export button.

Mobile phone:
- Wallet summary cards.
- Recent transactions.
- Request payout button.

Mobile tablet:
- Wallet cards + transaction table.

Acceptance criteria:
- Every tenant can see BeautyOS Wallet Balance.
- Wallet ledger is auditable.
- General Office can monitor balances.

---

# Batch 105 - MTN MoMo Direct Request to Pay

Build direct MTN MoMo Request to Pay.

Backend:
- Create MtnMomoService.
- Create MtnMomoTokenService.
- Create MtnMomoCollectionService.
- Implement access token request.
- Implement Request to Pay.
- Implement transaction status check.
- Implement callback/webhook endpoint.
- Store:
  - transaction_uuid
  - provider_reference
  - provider_status
  - provider_response
  - callback_received_at
  - status_checked_at

Payment request flow:
- Create payment request.
- Call MTN Request to Pay.
- Mark as processing.
- Customer approves on phone.
- MTN callback updates status.
- Verification confirms status.
- Settlement service updates linked record and wallet.

Security:
- Never collect MoMo PIN.
- Validate webhook/callback as much as supported.
- Use idempotency protection.
- Log provider errors.

Web:
- Add MTN MoMo Direct to Request Payment modal.
- Show phone approval instructions.
- Status: waiting for customer approval.
- Refresh status.
- Retry if failed.
- Cancel if pending where safe.

Mobile phone:
- Create MTN MoMo request.
- Waiting approval screen.
- Status refresh.
- Success/failed screen.

Mobile tablet:
- Payment request panel beside booking/invoice/POS details.
- Status timeline.

Acceptance criteria:
- Tenant can request MTN MoMo payment.
- Customer authorizes on their own phone.
- BeautyOS updates status correctly.

---

# Batch 106 - MTN Account Balance Sync

Build MTN account balance display where supported.

Important:
This is for MTN merchant/API accounts only, not personal MoMo wallet balance unless officially approved.

Backend:
- Add MtnMomoBalanceService.
- Implement account balance endpoint for:
  - platform MTN account
  - tenant-owned MTN account if configured
- Add mtn_balance_snapshots table.
- Fields:
  - id
  - tenant_id nullable
  - provider_account_id
  - account_type
  - currency
  - balance
  - available_balance nullable
  - raw_response json
  - synced_at
  - status
  - error_message nullable

APIs:
- Sync platform MTN balance.
- Sync tenant MTN balance.
- Get latest balance.
- Get balance history.

General Office Web:
- Show platform MTN balance.
- Show last synced time.
- Show sync status.
- Show provider errors.
- Show balance history chart.

Tenant Web:
- If using BeautyOS platform account:
  - Show BeautyOS Wallet Balance.
  - Show note: This balance is based on payments collected through BeautyOS.
- If using tenant-owned MTN account:
  - Show Connected MTN Merchant Balance.
  - Show last synced time.
  - Show connection status.
  - Show BeautyOS payment records.

Mobile phone:
- Wallet balance screen.
- Connected MTN balance card only if tenant-owned MTN account exists.

Mobile tablet:
- Wallet + MTN balance dashboard.

Acceptance criteria:
- Tenants can see BeautyOS balance.
- Enterprise tenants can see connected MTN merchant balance when supported.
- System does not misrepresent personal MoMo balances.

---

# Batch 107 - MTN Payment Settlement to Tenant Wallet

Connect MTN successful payments to tenant wallet and linked records.

Backend:
- Create or update PaymentRequestSettlementService.
- When MTN status is successful:
  - Create payment record.
  - Update booking/invoice/POS/SMS invoice.
  - Credit tenant wallet.
  - Apply platform fee.
  - Apply gateway fee if configured.
  - Add wallet ledger transactions.
- Prevent duplicate settlement on repeated callbacks.
- Store settlement status:
  - pending
  - settled
  - failed

Web:
- Payment request detail shows:
  - Provider status
  - Internal settlement status
  - Wallet credit
  - Fees deducted
  - Linked record
- Receipt view.

Mobile phone:
- Payment detail and receipt.
- Wallet update confirmation.

Mobile tablet:
- Settlement timeline.

Acceptance criteria:
- Successful MTN payment updates tenant wallet correctly.
- Duplicate callbacks do not duplicate wallet credit.
- Linked business records update correctly.

---

# Batch 108 - Tenant Payout & Settlement Requests

Build payout/settlement request system for tenants using BeautyOS platform account.

Backend:
- Create tenant_settlements table.
- Fields:
  - id
  - tenant_id
  - amount
  - fees
  - net_amount
  - currency
  - status: requested, pending_review, approved, paid, rejected, cancelled, failed
  - settlement_method
  - settlement_account_name
  - settlement_account_number
  - settlement_provider
  - requested_by_user_id
  - approved_by_user_id nullable
  - paid_by_user_id nullable
  - settlement_reference nullable
  - note nullable
  - requested_at
  - approved_at nullable
  - paid_at nullable
  - created_at
  - updated_at

APIs:
- Tenant request payout.
- General Office approve/reject.
- General Office mark paid.
- Tenant cancel pending request.
- List settlements.
- Show settlement.

Rules:
- Tenant cannot request more than available balance.
- Approved/paid settlement debits wallet.
- Mark paid requires reference.
- All changes audited.

Web tenant:
- Request payout button.
- Settlement form.
- Settlement history.
- Status timeline.

Web General Office:
- Settlement approval queue.
- Tenant wallet balances.
- Mark as paid.
- Export settlement report.

Mobile phone:
- Tenant can request payout.
- Tenant can view payout status.
- General Office/admin can approve/mark paid if permitted.

Mobile tablet:
- Settlement approval dashboard.

Acceptance criteria:
- Tenants can request payout.
- General Office can approve and record settlement.
- Wallet ledger remains accurate.

---

# Batch 109 - MTN Fees, Commissions & Settlement Rules

Build configurable MTN fees and commission rules.

Backend:
- Create payment_fee_rules table.
- Fields:
  - id
  - tenant_id nullable
  - gateway
  - fee_type: percentage, fixed, hybrid
  - percentage_rate
  - fixed_amount
  - minimum_fee
  - maximum_fee
  - applies_to: booking, invoice, pos, sms_package, manual, all
  - active
  - effective_from
  - effective_to

Rules:
- Platform default fee applies if tenant-specific fee missing.
- Tenant-specific fee overrides platform rule.
- Fees must be visible in wallet ledger.
- Fees should be included in settlement calculations.

Web:
- General Office fee settings.
- Tenant can view applicable fees but cannot edit unless allowed.
- Fee breakdown on payment detail.

Mobile:
- Fee summary on payment and wallet screens.

Acceptance criteria:
- Platform can monetize MTN payments.
- Fees are calculated transparently.
- Wallet transactions show fee deductions.

---

# Batch 110 - MTN Payment Logs, Errors & Provider Health

Build MTN logs and provider monitoring.

Backend:
- Create mtn_momo_api_logs table.
- Fields:
  - id
  - tenant_id nullable
  - provider_account_id
  - endpoint
  - method
  - request_reference
  - response_status
  - success
  - error_code
  - error_message
  - duration_ms
  - created_at

- Create provider health checks.
- Track:
  - token generation success/failure
  - Request to Pay success/failure
  - callback received
  - status check failures
  - balance sync failures

Web General Office:
- MTN Provider Health dashboard.
- API logs.
- Error filters.
- Failed transactions.
- Retry status check.

Tenant Web:
- Show friendly error messages only.
- Hide technical provider logs unless advanced/enterprise.

Mobile:
- Simple connection status.
- Payment failed reasons.

Acceptance criteria:
- General Office can troubleshoot MTN issues.
- Tenants see understandable statuses.
- Provider errors are logged.

---

# Batch 111 - MTN Notifications & Receipts

Build MTN payment notifications and receipts.

Backend:
- Notification jobs for:
  - payment request sent
  - payment successful
  - payment failed
  - payment expired
  - payout requested
  - payout approved
  - payout paid
- Channels:
  - in-app
  - email
  - SMS if tenant has SMS balance
  - push notification placeholder
- Receipt generation:
  - receipt number
  - tenant
  - customer
  - amount
  - fees
  - gateway
  - transaction reference
  - date/time
  - linked booking/invoice/POS

Web:
- Receipt page.
- Download/print receipt.
- Notification history.

Mobile phone:
- Receipt view.
- Share receipt.
- Push/in-app notification status.

Mobile tablet:
- Receipt and timeline panel.

Acceptance criteria:
- Customers and tenants receive updates.
- Receipts are clear and professional.
- Notification failures do not break payment flow.

---

# Batch 112 - MTN Tenant Dashboard & Analytics

Build tenant MTN dashboard and analytics.

Tenant metrics:
- Available BeautyOS balance
- Pending balance
- Total MTN collected
- Total successful MTN payments
- Failed MTN payments
- Average approval time
- Total fees
- Total settled
- Payouts pending
- Payments by source: booking, invoice, POS, SMS package, manual

General Office metrics:
- Platform MTN collections
- Total tenant balances
- Total settlement liability
- Fees earned
- Failed payment rate
- Top tenants by MTN volume
- Provider health
- MTN balance trend if supported

Charts:
- Collections over time
- Success vs failed
- Fees earned
- Settlement trend
- Tenant ranking
- Payment source breakdown

Web:
- Tenant Payments Dashboard.
- General Office MTN Dashboard.

Mobile phone:
- Key wallet/payment metrics.
- Recent MTN payments.
- Payout status.

Mobile tablet:
- Analytics dashboard with cards and charts.

Acceptance criteria:
- Tenants can understand their MTN payment performance.
- General Office can monitor platform MTN operations.

---

# Batch 113 - MTN Security, Permissions & Final Polish

Finalize and secure MTN MoMo features.

Tasks:
- Add permissions:
  - mtn.view
  - mtn.configure
  - mtn.request_payment
  - mtn.view_balance
  - mtn.sync_balance
  - mtn.view_logs
  - mtn.manage_settlements
  - mtn.approve_settlements
- Add audit logs for:
  - settings changes
  - payment requests
  - callback processing
  - wallet adjustments
  - settlement approval
  - settlement paid
  - tenant-owned account changes
- Add tests:
  - tenant isolation
  - MTN request to pay
  - status mapping
  - callback idempotency
  - wallet credit
  - fee calculation
  - payout request
  - settlement payment
  - balance sync
  - permission checks
- Improve web UI consistency.
- Improve phone UI.
- Improve tablet UI.
- Add documentation:
  - env variables
  - sandbox testing
  - production checklist
  - settlement operations
  - tenant payment modes
- Add clear warnings:
  - Never ask customer for MoMo PIN.
  - BeautyOS Wallet is not the same as personal MoMo wallet.
  - Connected MTN merchant balance is available only when supported.

Acceptance criteria:
- MTN MoMo feature is market-ready.
- Tenants can collect payments and view BeautyOS wallet balance.
- Enterprise tenants can connect own MTN account if allowed.
- General Office can monitor and settle payments.
- System is secure, auditable, and mobile-ready.
