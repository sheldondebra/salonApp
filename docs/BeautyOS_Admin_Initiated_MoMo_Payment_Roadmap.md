# BeautyOS Admin-Initiated MoMo Payment Requests Roadmap

This roadmap builds an Admin-Initiated Mobile Money payment request feature for BeautyOS.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, booking, invoice, POS, payment, Paystack, Flutterwave, customer, notification, role, dashboard, and mobile app patterns.

Important security rule:
Never collect, display, transmit, or store a customer's Mobile Money PIN inside BeautyOS.

Correct flow:
Admin creates payment request -> customer receives MoMo approval on phone -> customer enters PIN privately -> gateway confirms -> BeautyOS marks record as paid.

Supported gateways:
- Paystack
- Flutterwave

Initial use cases:
- Booking payment
- Booking deposit
- Invoice payment
- POS sale payment
- SMS package invoice payment
- Manual customer payment request

---

## Cross-Platform Rule

Every batch must include:
1. Laravel backend API
2. Web frontend
3. Mobile phone UI
4. Mobile tablet UI

Mobile/tablet must support 60-80% of daily shop operations for tenants without laptops.

Design:
- Clean modern SaaS UI
- Premium baby-pink BeautyOS theme
- Shadcn UI on web
- React Native mobile UI
- Clear status cards
- Timeline/activity view
- Loading, empty, error, and success states

---

## Batch 93 - Payment Request Foundation

Backend:
- Create payment_requests table.
- Fields: id, tenant_id, branch_id, customer_id, booking_id, invoice_id, pos_sale_id, sms_purchase_invoice_id, requested_by_user_id, amount, currency, phone, email, gateway, payment_channel, reason, description, reference, external_reference, status, provider_status, provider_response, failed_reason, expires_at, paid_at, cancelled_at, timestamps, soft deletes.
- Statuses: pending, processing, success, failed, expired, cancelled.
- Create PaymentRequestService.
- Create PaymentReferenceGenerator.
- Add tenant-scoped relationships.
- Add validation requests.
- Add policies/permissions.

Permissions:
- payment_requests.view
- payment_requests.create
- payment_requests.cancel
- payment_requests.retry
- payment_requests.verify

Web:
- Add Payment Requests page.
- Add table with filters: status, gateway, customer, date range, reason.
- Add detail drawer.
- Add status badges.
- Add empty/loading/error states.

Mobile phone:
- Payment requests list.
- Payment request detail.
- Status display.

Mobile tablet:
- Split layout: requests list left, details/status timeline right.

Acceptance criteria:
- Payment request records can be created and listed.
- Records are tenant-scoped.
- Statuses are clear and auditable.

---

## Batch 94 - Create Payment Request UX

Backend:
- Add POST /payment-requests endpoint.
- Validate amount, currency, phone, customer, gateway, reason, linked booking/invoice/POS sale where provided.
- Normalize phone numbers.
- Prevent invalid amount.
- Prevent requests for already-paid records.
- Generate unique reference.

Web:
Add Request MoMo Payment action in:
- Booking details
- Invoice details
- POS sale details
- Customer profile
- Payment Requests page

Modal fields:
- Customer searchable select
- Phone number
- Amount
- Currency
- Gateway: Paystack or Flutterwave
- Reason: booking payment, deposit payment, invoice payment, POS sale, SMS package invoice, other
- Description/note

UX:
- Show warning: Customer enters MoMo PIN only on their own phone. Do not ask for their PIN.
- Show confirmation before sending.
- Show waiting-for-approval screen after sending.

Mobile phone:
- Create payment request from booking/invoice/POS/customer.
- Single-column form.
- Share/copy fallback payment link if available.

Mobile tablet:
- Payment request form beside booking/invoice/customer details.

Acceptance criteria:
- Authorized user can create a MoMo payment request.
- App never asks for MoMo PIN.

---

## Batch 95 - Paystack MoMo Charge Integration

Backend:
- Add or reuse PaystackGateway service.
- Implement Paystack mobile money charge where supported.
- Store Paystack reference and provider response.
- Handle statuses: pending, send_otp if applicable, success, failed, abandoned, timeout.
- Add GET /payment-requests/{id}/status.
- Add Paystack verification method.
- Add secure Paystack webhook handler.
- Prevent duplicate crediting with idempotency protection.

Important:
- Do not collect PIN in BeautyOS.
- Customer approval must happen through provider/network prompt or official gateway flow.

Web:
- Show Paystack request status.
- Show Waiting for customer approval.
- Add refresh/check status.
- Add retry if failed.
- Add receipt after success.

Mobile phone:
- Waiting for approval screen.
- Status refresh.
- Success/failure screen.

Mobile tablet:
- Status timeline panel.

Acceptance criteria:
- Paystack payment request can be initiated.
- Payment status updates after verification/webhook.
- Successful payment updates linked record where applicable.

---

## Batch 96 - Flutterwave Ghana MoMo Integration

Backend:
- Add or reuse FlutterwaveGateway service.
- Initialize Ghana Mobile Money payment request.
- Required data: amount, currency, phone, email, customer name, transaction reference.
- Store Flutterwave transaction/reference.
- Implement verification endpoint.
- Implement secure webhook handler.
- Map Flutterwave statuses to BeautyOS statuses.
- Add idempotency protection and provider error handling.

Web:
- Gateway selection supports Flutterwave.
- Show Flutterwave status messages.
- Show failed reason where available.
- Add retry/check status.

Mobile phone:
- Flutterwave payment request flow.
- Status card.

Mobile tablet:
- Payment status timeline.

Acceptance criteria:
- Flutterwave MoMo payment request can be initiated.
- Verification updates BeautyOS correctly.

---

## Batch 97 - Linked Payment Settlement Logic

When payment succeeds:
- Booking payment/deposit updates booking payment status.
- Invoice payment marks invoice paid or partially paid.
- POS sale marks paid.
- SMS package invoice credits SMS wallet after verified payment.
- Manual payment creates a payment record.

Backend:
- Create PaymentRequestSettlementService.
- Ensure settlement is idempotent.
- Add settlement_status: not_required, pending, settled, failed.
- Add settlement logs and audit logs.
- Prevent duplicate wallet crediting, invoice payment, or booking payment.

Web:
- Show linked record on payment request detail.
- Show settlement status.
- Show receipt/payment record after success.
- Show settlement error if gateway payment succeeded but internal update failed.

Mobile phone:
- Show linked record and final status.

Mobile tablet:
- Activity timeline with settlement details.

Acceptance criteria:
- Successful requests update linked records correctly.
- Settlement is safe from duplicate webhooks.

---

## Batch 98 - Retry, Cancel, Expiry & Fallback Links

Backend:
- Add cancel endpoint.
- Add retry endpoint.
- Add expiry job for old pending requests.
- Add optional fallback payment link generation if gateway supports hosted checkout.
- Add reason for cancellation.
- Add retry_count and max retry limit.
- Add cancelled_by_user_id.

Rules:
- Cannot cancel successful request.
- Cannot retry successful request.
- Cannot retry too many times.
- Expired requests cannot be paid unless retried/recreated.
- Retried requests should use a new reference if gateway requires it.

Web:
- Retry button.
- Cancel button.
- Copy/share payment link if available.
- Expired state.
- Cancel confirmation dialog.

Mobile phone:
- Retry/cancel actions for authorized users.
- Share payment link.

Mobile tablet:
- Actions panel.

Acceptance criteria:
- Pending requests can expire.
- Failed requests can be retried safely.
- Successful requests cannot be duplicated.

---

## Batch 99 - Payment Request Notifications

Channels:
- SMS if tenant has SMS balance
- Email
- In-app notification
- WhatsApp placeholder/future

Notify customer when:
- Payment request is created
- Payment succeeds
- Payment fails
- Receipt is available

Notify admin/staff when:
- Payment succeeds
- Payment fails
- Payment request expires

Backend:
- Add notification jobs.
- Add templates.
- Add notification logs.
- Respect tenant SMS wallet balance before sending SMS.
- Do not block payment request creation if SMS fails.

Web:
- Notification history on payment request detail.
- Resend notification action if allowed.

Mobile:
- Push/in-app notification placeholder.
- Notification status.

Acceptance criteria:
- Customer and admin get useful updates.
- Notification failures are logged.
- SMS balance rules are respected.

---

## Batch 100 - Payment Request Analytics

General Office analytics:
- Total payment requests
- Success rate
- Failed rate
- Expired rate
- Volume by gateway
- Revenue processed
- Average approval time
- Failed reasons
- Tenant ranking by payment request volume

Tenant analytics:
- Total requests
- Successful requests
- Failed requests
- Pending requests
- Revenue collected
- Source: booking, invoice, POS, SMS package, manual

Web:
- Analytics cards.
- Recharts charts.
- Date filters.
- Gateway filters.
- Export CSV.

Mobile phone:
- Simple payment request summary.

Mobile tablet:
- Analytics dashboard.

Acceptance criteria:
- Admin can monitor MoMo payment performance.
- Reports are tenant-scoped except General Office.

---

## Batch 101 - Payment Request Security & Final Polish

Tasks:
- Add permissions to all endpoints.
- Add audit logs.
- Add webhook signature verification.
- Add idempotency keys.
- Add tests for create, cancel, retry, webhook success, duplicate webhook, failed payment, expired request, settlement, and tenant isolation.
- Improve UI consistency.
- Add loading skeletons.
- Add empty/error states.
- Improve mobile phone UX.
- Improve mobile tablet UX.
- Update documentation.

Acceptance criteria:
- Feature is production-ready.
- MoMo PIN is never collected by BeautyOS.
- Payment records are auditable.
- Web, phone, and tablet flows are clean and useful.
