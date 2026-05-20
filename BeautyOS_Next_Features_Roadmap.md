# BeautyOS Next Features Roadmap

Use this file after completing the core SaaS, booking, payments, notifications, reports, WordPress API, mobile API preparation, and first market-readiness polish.

General Cursor instruction for every batch:

```text
Read this markdown file and execute the requested batch only.
Inspect the existing code first.
Reuse existing models, components, services, layouts, routes, and patterns.
Do not rebuild from scratch.
Do not jump ahead to another batch.
Keep changes focused, clean, and production-ready.
Maintain the premium baby-pink SaaS UI using Shadcn UI, Tailwind, Lucide icons, and reusable components.
After finishing, summarize files changed, features completed, how to test, and what remains for the next batch.
```

---

## Batch 21 — Advanced Inventory Management

```text
Execute Batch 21 only: Advanced Inventory Management.

Build inventory features for salons, spas, barbers, nail techs, and beauty businesses.

Features:
- Product categories
- Products/items
- SKU/barcode field
- Supplier management
- Stock quantity
- Low stock threshold
- Stock adjustment
- Stock movement history
- Branch-specific inventory
- Product cost price
- Retail selling price
- Product image
- Active/inactive status

UI:
- Inventory dashboard
- Product table
- Add/edit product form
- Stock adjustment modal
- Low stock alerts
- Supplier table
- Branch filter

Backend:
- Tenant-scoped models and APIs
- Validation
- Audit logs for stock changes
- Prevent negative stock unless explicitly allowed in settings

Acceptance criteria:
- Tenants can manage products and stock.
- Stock changes are tracked.
- Low stock products are clearly shown.
```

---

## Batch 22 — POS System

```text
Execute Batch 22 only: POS System.

Build a simple but professional POS system connected to bookings, customers, payments, and inventory.

Features:
- New sale
- Add services to sale
- Add products to sale
- Select customer or walk-in
- Apply discount/coupon
- Tax/service charge support
- Accept payment method
- Split payment placeholder
- Tips placeholder
- Generate receipt
- Update inventory after product sale
- Link sale to appointment where applicable

UI:
- Fast POS screen
- Product/service search
- Cart panel
- Customer selector
- Payment modal
- Receipt preview
- Recent sales table

Backend:
- Sales table
- Sale items table
- Payment records
- Inventory deduction
- Tenant scope

Acceptance criteria:
- Tenant can complete a sale.
- Inventory reduces correctly for product sales.
- Receipts can be viewed.
```

---

## Batch 23 — Loyalty Program

```text
Execute Batch 23 only: Loyalty Program.

Build a loyalty system for tenant customers.

Features:
- Enable/disable loyalty per tenant
- Points earning rules
- Points redemption rules
- Customer points balance
- Points transaction history
- Manual points adjustment
- Reward tiers placeholder

Examples:
- Earn 1 point per GHS 1 spent
- Redeem 100 points for GHS 10 discount

UI:
- Loyalty settings page
- Customer loyalty card
- Points history table
- Manual adjustment modal

Backend:
- Tenant-scoped loyalty settings
- Points ledger
- Apply points during checkout/POS

Acceptance criteria:
- Customers earn points from eligible payments.
- Customers can redeem points according to tenant rules.
- All points changes are logged.
```

---

## Batch 24 — Memberships & Packages

```text
Execute Batch 24 only: Memberships and Packages.

Build tenant-level memberships and service packages.

Memberships:
- Membership plans
- Monthly/recurring membership placeholder
- Member benefits
- Discounts by membership
- Customer membership status
- Expiry date

Packages:
- Package name
- Included services
- Number of sessions
- Validity period
- Package price
- Customer package balance
- Redeem package session during booking/POS

UI:
- Membership plans table
- Package builder
- Customer membership view
- Package balance view

Backend:
- Tenant-scoped models
- Package redemption ledger
- Membership assignment

Acceptance criteria:
- Tenant can sell/assign packages.
- Package sessions reduce after use.
- Membership benefits can apply discounts.
```

---

## Batch 25 — Gift Cards

```text
Execute Batch 25 only: Gift Cards.

Build gift card support.

Features:
- Create gift card
- Sell gift card
- Gift card code
- Balance tracking
- Expiry date
- Partial redemption
- Gift card redemption history
- Active/inactive status

UI:
- Gift cards table
- Create/sell gift card modal
- Redeem gift card field in checkout/POS
- Balance lookup

Backend:
- Tenant-scoped gift cards
- Secure random code generation
- Redemption ledger
- Prevent over-redemption

Acceptance criteria:
- Gift cards can be sold and redeemed.
- Balance updates correctly.
- Redemption history is available.
```

---

## Batch 26 — Marketplace Discovery

```text
Execute Batch 26 only: Marketplace Discovery.

Build the foundation for a public beauty marketplace.

Features:
- Public marketplace homepage
- Search businesses
- Filter by category, location, rating, service, price range
- Business profile page
- Service listing
- Staff listing
- Reviews summary
- Book from marketplace
- Featured businesses placeholder

UI:
- Clean marketplace cards
- Search/filter bar
- Business profile page
- Mobile-first design

Backend:
- Marketplace visibility setting per tenant
- Public tenant search API
- Public service search API
- Location fields

Acceptance criteria:
- Public users can discover visible tenants.
- Hidden tenants do not appear.
- Booking flow can start from marketplace profile.
```

---

## Batch 27 — Reviews & Reputation

```text
Execute Batch 27 only: Reviews and Reputation.

Build an improved review system.

Features:
- Customer review after completed booking
- Rating for business
- Rating for staff
- Rating for service
- Review moderation
- Public/private visibility
- Reply to review
- Review request notification placeholder

UI:
- Reviews dashboard
- Review cards
- Moderation controls
- Public reviews section

Backend:
- Tenant-scoped review logic
- Prevent duplicate reviews for same completed appointment
- Average rating calculations

Acceptance criteria:
- Customers can review completed bookings.
- Tenants can moderate and reply.
- Public pages show approved reviews.
```

---

## Batch 28 — Advanced Marketing Campaigns

```text
Execute Batch 28 only: Advanced Marketing Campaigns.

Build tenant marketing campaign foundation.

Channels:
- SMS via MNotify
- Email via Laravel Mail
- WhatsApp placeholder

Features:
- Campaign list
- Create campaign
- Audience selector
- Customer segments
- Schedule campaign placeholder
- Send now
- Campaign logs
- Delivery status placeholder

Segments:
- All customers
- Customers with upcoming bookings
- Inactive customers
- Birthday month customers
- High-value customers

UI:
- Campaign builder
- Audience preview
- Message editor
- Campaign analytics

Backend:
- Queue sending
- Tenant SMS usage tracking
- Campaign logs

Acceptance criteria:
- Tenant can create and send SMS/email campaigns.
- Sending is queued.
- Logs are stored.
```

---

## Batch 29 — WhatsApp Booking Foundation

```text
Execute Batch 29 only: WhatsApp Booking Foundation.

Prepare WhatsApp-first booking support.

Features:
- Tenant WhatsApp number setting
- WhatsApp booking link generator
- Click-to-WhatsApp buttons on public booking page
- Pre-filled booking message
- WhatsApp notification placeholder
- WhatsApp API provider abstraction placeholder

UI:
- WhatsApp settings page
- Preview generated WhatsApp link
- Public page WhatsApp CTA

Backend:
- Store WhatsApp settings per tenant
- Service class placeholder for future WhatsApp Business API

Acceptance criteria:
- Tenants can configure WhatsApp booking links.
- Public booking pages show WhatsApp CTA when enabled.
```

---

## Batch 30 — AI Assistant Foundation

```text
Execute Batch 30 only: AI Assistant Foundation.

Build an AI assistant foundation without hardcoding a specific provider.

Use cases:
- Help tenant understand dashboard metrics
- Suggest slow booking periods
- Suggest marketing campaign ideas
- Draft SMS/email messages
- Booking assistant placeholder

Features:
- AI settings page
- AI prompt templates table
- AI activity logs
- Provider abstraction
- Disabled-by-default feature flag

UI:
- AI Assistant page
- Prompt template manager
- Simple chat-like admin interface placeholder

Backend:
- AI service abstraction
- Logs
- Tenant-level enable/disable

Acceptance criteria:
- AI feature is safely scaffolded.
- No provider lock-in.
- Can be enabled later without refactoring core app.
```

---

## Batch 31 — White Label & Enterprise Tools

```text
Execute Batch 31 only: White Label and Enterprise Tools.

Build enterprise white-label foundations.

Features:
- White-label flag per tenant
- Hide platform branding where allowed
- Custom logo/favicon
- Custom primary color
- Custom terms/privacy links
- Enterprise support contact
- Custom email sender placeholder
- Enterprise onboarding notes

UI:
- White-label settings page
- Live preview card
- Super Admin enterprise controls

Backend:
- Tenant white-label settings
- Permission protection

Acceptance criteria:
- Super Admin can enable white-label for selected tenants.
- Tenant branding changes apply to public booking pages and dashboard where allowed.
```

---

## Batch 32 — Security, Audit & Compliance

```text
Execute Batch 32 only: Security, Audit and Compliance.

Improve production security.

Features:
- Audit logs for important actions
- Login history
- Failed login tracking
- API rate limiting review
- Sensitive settings masked in UI
- Role/permission audit page
- Tenant isolation test notes
- Data export placeholder
- Account deletion request placeholder

UI:
- Audit log table
- Security settings page
- Login history page

Backend:
- Audit middleware/events
- Security events
- Improved validation and authorization checks

Acceptance criteria:
- Important actions are logged.
- Admins can review audit activity.
- Security settings are clearer.
```

---

## Batch 33 — Developer API & Webhooks

```text
Execute Batch 33 only: Developer API and Webhooks.

Build developer integration foundations.

Features:
- Tenant API keys
- Webhook endpoints configuration
- Webhook event types
- Webhook delivery logs
- Retry placeholder
- API documentation page

Webhook events:
- appointment.created
- appointment.cancelled
- payment.successful
- customer.created
- review.created

UI:
- Developer settings page
- API key manager
- Webhook manager
- Delivery logs table

Backend:
- Secure API key hashing
- Webhook signing secret
- Event dispatcher

Acceptance criteria:
- Tenants can create API keys.
- Tenants can configure webhooks.
- Webhook deliveries are logged.
```

---

## Batch 34 — Performance & Production Hardening

```text
Execute Batch 34 only: Performance and Production Hardening.

Improve performance and reliability.

Tasks:
- Review database indexes
- Optimize slow queries
- Add pagination where missing
- Add caching where useful
- Improve API response consistency
- Review queue jobs
- Add retry handling where needed
- Improve frontend loading states
- Improve route-level error boundaries
- Improve SEO for public pages

Acceptance criteria:
- Core pages load faster.
- APIs are consistent.
- Public pages have good SEO basics.
- No major performance bottlenecks remain.
```

---

## Batch 35 — Final Launch Checklist

```text
Execute Batch 35 only: Final Launch Checklist.

Prepare the app for market launch.

Tasks:
- Review all main user journeys
- Fix broken flows
- Verify tenant isolation
- Verify permissions
- Verify payment callbacks
- Verify SMS sending/logging
- Verify booking flow
- Verify public booking page
- Verify mobile responsiveness
- Clean seed/demo data
- Improve README
- Add deployment notes
- Add environment variable guide
- Add admin setup guide

Acceptance criteria:
- App is ready for beta users.
- Setup documentation is clear.
- Main business workflows work end-to-end.
```

---

## Short Cursor Commands

```text
Read BeautyOS_Next_Features_Roadmap.md and execute Batch 21 only. Inspect existing code first. Do not rebuild from scratch.
```

```text
Continue with the next batch only from BeautyOS_Next_Features_Roadmap.md. Keep changes focused.
```

```text
Fix issues in the last batch only. Do not add new features.
```

```text
Review the current batch against its acceptance criteria and fix gaps only.
```
