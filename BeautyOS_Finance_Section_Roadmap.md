# BeautyOS Finance Section Roadmap

This roadmap builds an advanced Finance Section for BeautyOS to help sell the product and make tenants manage money professionally.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, booking, POS, payment, wallet, payroll, staff, inventory, SMS reseller, roles, reports, web, and mobile patterns.

## Feature Goal

Build a premium finance command center for each tenant and for General Office.

The Finance Section should help salons, spas, nail techs, barbers, and wellness businesses manage revenue, expenses, payments, invoices, receipts, wallets, settlements, payroll, commissions, tips, taxes, discounts, refunds, gift cards, memberships, packages, product sales, financial reports, cash drawer/POS reconciliation, and profit/loss insights.

Competitor-inspired finance features:
- Fresha-style checkout, tips, split payments, packages, memberships, gift cards, payroll summaries, commissions, and advanced reports.
- Vagaro-style reports for sales, services, tips, income, payroll, taxes, and retention.
- Phorest-style enterprise financial reporting and multi-location accounting insights.
- GlossGenius-style integrated payments, payroll, no-show protection, fee tracking, and tax-ready records.

## Cross-Platform Rule

Every batch must include:
1. Laravel backend API
2. Web frontend
3. Mobile phone UI
4. Mobile tablet UI

Mobile/tablet should support 60-80% of daily shop operations for businesses without laptops.

## Design Rules

Use clean modern SaaS UI, premium baby-pink BeautyOS accents, Shadcn UI on web, React Native mobile UI, Lucide icons or matching mobile icons, Recharts, clean finance cards, status badges, smart filters, export buttons, transaction timelines, empty states, loading skeletons, error states, and mobile-first screens.

Finance UI should feel like Stripe, Shopify Admin, Square, Fresha, QuickBooks-lite, and Grafana-style reporting.

---

## Batch 136 - Finance Dashboard Foundation

Backend:
- Create finance overview API.
- Aggregate gross revenue, net revenue, total payments, pending payments, failed payments, refunds, tips, discounts, expenses, payroll cost, platform/gateway fees, outstanding invoices, wallet balance.
- Add date range, branch, staff, and service filters.

Web:
- Create Finance section in tenant dashboard.
- Menu items: Overview, Transactions, Payments, Invoices, Expenses, Payroll, Commissions, Tips, Wallet, Settlements, Taxes, Reports, Reconciliation, Settings.
- Dashboard cards: Revenue today, Revenue this month, Net revenue, Outstanding invoices, Expenses, Payroll due, Tips collected, Refunds.
- Charts: Revenue trend, Payment method breakdown, Service revenue, Staff revenue, Expenses trend, Profit estimate.

Mobile phone:
- Finance home screen with key cards, recent payments, outstanding invoices, and quick actions: Create invoice, Record expense, Request payment, View wallet.

Mobile tablet:
- Finance dashboard with cards and charts.

Acceptance criteria:
- Tenant can understand financial health quickly.
- Finance dashboard is tenant-scoped.
- UI is clean and premium.

---

## Batch 137 - Unified Transactions Ledger

Backend:
- Create finance_transactions table if not already covered by payment ledger.
- Fields: id, tenant_id, branch_id, customer_id, staff_id, source_type, source_id, transaction_type, payment_method, gateway, amount, currency, status, reference, description, occurred_at, metadata.
- Source types: booking, invoice, pos_sale, wallet, payroll, expense, refund, adjustment, gift_card, membership, sms_package.
- Transaction types: income, expense, fee, refund, payout, adjustment, tax, tip, commission.
- Ensure all payment and expense events create ledger records.

APIs:
- List transactions.
- View transaction.
- Export transactions.
- Filter by date, method, status, source, branch, staff, customer.

Web:
- Transactions page with search, filters, detail drawer, status badges, export CSV/Excel, transaction timeline.

Mobile phone:
- Transactions list, filter chips, transaction detail.

Mobile tablet:
- Transactions table plus detail panel.

Acceptance criteria:
- Tenant has one place to see all money movements.
- Reports can be built from ledger.

---

## Batch 138 - Invoices, Receipts & Payment Requests

Backend:
- Create or improve invoices table and invoice_items table.
- Invoice fields: tenant_id, customer_id, invoice_number, status, subtotal, discount_total, tax_total, total, amount_paid, balance_due, due_date, notes, terms.
- Statuses: draft, sent, partially_paid, paid, overdue, cancelled, refunded.
- Add invoice payments and receipt generation.
- Add payment request integration.

Features:
- Create invoice from booking.
- Create invoice from POS sale.
- Create manual invoice.
- Send invoice by SMS/email.
- Request MoMo/USSD/card payment.
- Partial payments.
- Mark cash payment.
- Void/cancel invoice.
- Download/print receipt.

Web:
- Invoices page, invoice builder, invoice detail with payment timeline, receipt preview, send invoice modal, request payment action.

Mobile phone:
- Create simple invoice, send invoice, view receipt, record payment.

Mobile tablet:
- Invoice builder with preview side-by-side.

Acceptance criteria:
- Tenants can invoice and collect payment professionally.
- Receipts look clean and branded.

---

## Batch 139 - Expenses Management

Backend:
- Create expense_categories and expenses tables.
- Expense fields: tenant_id, branch_id, category_id, vendor_name, amount, currency, payment_method, expense_date, receipt_file, tax_amount, note, status, created_by_user_id.
- Default categories: Rent, Salaries, Product supplies, Utilities, Marketing, Equipment, Repairs, Internet, Transport, Training, Software, Other.

Web:
- Expenses page, add expense modal, receipt upload, category filters, monthly expenses chart, vendor summary.

Mobile phone:
- Quick record expense, upload receipt from camera/gallery, recent expenses.

Mobile tablet:
- Expense table plus analytics.

Acceptance criteria:
- Tenants can track operating costs.
- Expenses feed into profit reports.

---

## Batch 140 - Tips, Discounts, Refunds & Adjustments

Backend:
- Support tips on payments/POS/booking checkout.
- Support manual discount, coupon discount, staff discount permission, manager approval threshold.
- Support full refund, partial refund, refund reason, gateway refund placeholder where supported, cash/manual refund.
- Support finance adjustments with audit logs.

Permissions:
- finance.apply_discount
- finance.approve_discount
- finance.refund
- finance.adjust_transaction
- finance.view_tips

Web:
- Tip tracking page, refund workflow, discount approval alert, adjustment modal, transaction timeline.

Mobile phone:
- Add tip at checkout, apply discount if permitted, request manager approval for high discount, refund action if permitted.

Mobile tablet:
- Checkout/transaction detail with tips/refunds/discount panel.

Acceptance criteria:
- Money changes are controlled and auditable.
- Tips, refunds, and discounts show in reports.

---

## Batch 141 - Payroll, Commissions & Staff Earnings Finance View

Backend:
- Reuse payroll profiles and payroll periods if existing.
- Aggregate payroll due, commissions earned, tips owed, staff payouts, deductions.
- Add finance payroll summary APIs.
- Add pay-period filters.
- Add export payroll summary.

Web:
- Finance > Payroll page, payroll cost cards, staff earnings table, commission breakdown, tips owed, payroll approval status, export button.

Mobile phone:
- Owner/admin payroll summary, staff own earnings view, approve payroll if permitted.

Mobile tablet:
- Payroll dashboard and staff earnings table.

Acceptance criteria:
- Finance section gives clear staff cost visibility.
- Staff earnings are transparent.

---

## Batch 142 - Cash Drawer & POS Reconciliation

Backend:
- Create cash_drawer_sessions table.
- Fields: tenant_id, branch_id, opened_by_user_id, closed_by_user_id, opening_cash, expected_cash, counted_cash, difference, status, opened_at, closed_at.
- Statuses: open, closed, discrepancy.
- Track cash sales, card sales, MoMo, USSD, gift cards.
- Add reconciliation notes.

Web:
- Finance > Reconciliation, open/close cash drawer, expected vs counted, payment method breakdown, discrepancy alerts, end-of-day report.

Mobile phone:
- Open/close drawer, count cash, end day summary.

Mobile tablet:
- Reconciliation dashboard.

Acceptance criteria:
- Salons can reconcile daily sales.
- Cash discrepancies are visible.

---

## Batch 143 - Taxes, VAT & Tax Reports

Backend:
- Create tax_rates table.
- Fields: tenant_id, name, rate, applies_to, inclusive_or_exclusive, active.
- Applies to: services, products, all.
- Add tax calculation to invoices/POS/payments where needed.
- Add tax reports: taxable sales, tax collected, tax by category, tax by period.
- Add export.

Web:
- Finance > Taxes, tax settings, tax report page, VAT summary.

Mobile phone:
- Tax summary and simple owner edit/read-only settings.

Mobile tablet:
- Tax report dashboard.

Acceptance criteria:
- Tenants can track taxes/VAT.
- Tax totals are visible for reporting.

---

## Batch 144 - Profit & Loss Lite

Backend:
- Calculate total income, cost of goods sold from inventory/POS where available, expenses, payroll, fees, refunds, and estimated profit.
- Add date range and branch filters.

Web:
- Finance > Profit & Loss with statement-style layout, income section, expense section, payroll section, fees section, net profit estimate, export PDF/Excel.

Mobile phone:
- Simple profit summary and income vs expenses chart.

Mobile tablet:
- P&L report with charts.

Acceptance criteria:
- Tenants can understand whether they are making money.
- Report is clear and not overcomplicated.

---

## Batch 145 - Memberships, Packages & Gift Card Finance

Backend:
- Track membership sales, package sales, gift card sales, redemptions, outstanding liabilities, expired balances.
- Create liability report.

Web:
- Finance > Prepaid Balances.
- Cards: Gift card liability, Package liability, Membership revenue, Redemptions.
- Tables: Active gift cards, Active packages, Membership payments.

Mobile phone:
- Gift card/package balance lookup and recent redemptions.

Mobile tablet:
- Prepaid balances dashboard.

Acceptance criteria:
- Tenant understands prepaid revenue and liabilities.
- Gift card/package usage is tracked financially.

---

## Batch 146 - Finance Forecasting & Smart Insights

Backend:
- Calculate projected monthly revenue, busiest revenue days, underperforming services, top revenue staff, high refund rate warning, high discount warning, payroll-to-revenue ratio, expense spike warning, low cashflow warning.
- Insight severity: info, warning, critical, opportunity.

Web:
- Finance Insights page with insight cards, trend comparisons, and suggested actions such as increase prices, reduce discounts, promote low-demand slots, restock popular products, follow up unpaid invoices.

Mobile phone:
- Finance insights feed and push/in-app alert placeholders.

Mobile tablet:
- Insights board.

Acceptance criteria:
- Finance section gives useful business advice, not just numbers.

---

## Batch 147 - General Office Finance Oversight

Backend:
- Platform finance overview: subscription revenue, payment processing volume, SMS revenue, platform fees, settlement liability, failed payments, tenant balances, refunds, unpaid invoices.
- Tenant-level finance risk indicators.

Web:
- General Office > Finance.
- Cards: MRR, ARR, Total processed volume, Platform fees earned, SMS revenue, Settlement liability, Failed payments.
- Tables: top tenants by revenue, tenants with failed payments, tenants with high refunds, tenants with unpaid SaaS invoices, settlement queue.

Mobile phone:
- Executive finance snapshot, failed payment alerts, settlement alerts.

Mobile tablet:
- Platform finance dashboard.

Acceptance criteria:
- General Office can monitor business financial health.
- Finance risk is visible.

---

## Batch 148 - Finance Permissions, Audit Logs & Controls

Permissions:
- finance.view
- finance.transactions.view
- finance.invoices.manage
- finance.expenses.manage
- finance.refunds.manage
- finance.discounts.manage
- finance.payroll.view
- finance.payroll.manage
- finance.reports.view
- finance.reports.export
- finance.settings.manage
- finance.adjustments.manage

Backend:
- Add audit logs for refund, discount, adjustment, expense deletion, invoice cancellation, tax setting change, payroll approval, wallet adjustment.
- Add approval thresholds: discount above X requires manager, refund above X requires owner, wallet adjustment requires owner/super admin.

Web/Mobile:
- Hide restricted actions.
- Show approval required states.
- Add confirmation dialogs.

Acceptance criteria:
- Finance actions are safe and controlled.
- Sensitive actions are auditable.

---

## Batch 149 - Finance Export, Accounting Integrations & Documents

Backend:
- CSV/Excel/PDF exports: transactions, invoices, payments, expenses, payroll, P&L, tax report, settlements.
- Add export history.
- Add accounting integration placeholders: QuickBooks, Xero, Zoho Books, Google Sheets.

Web:
- Export center, export history, scheduled report placeholder, accounting integrations settings placeholder.

Mobile phone:
- Download/share key reports.

Mobile tablet:
- Export center view.

Acceptance criteria:
- Tenants can send finance data to accountants.
- Reports are downloadable.

---

## Batch 150 - Finance Final Polish & Market Readiness

Tasks:
- Improve UI consistency.
- Improve mobile phone experience.
- Improve tablet experience.
- Add empty states, loading skeletons, error states.
- Add charts where useful.
- Add saved filters placeholder.
- Add tests for tenant isolation, transaction ledger, invoice totals, tax calculations, expense creation, refunds, discounts, payroll summaries, wallet balances, exports, permissions.
- Update documentation.

Acceptance criteria:
- Finance module is market-ready.
- It helps sell BeautyOS as more than booking software.
- Tenants can run daily financial operations from web, phone, or tablet.
