# BeautyOS Feature Build Roadmap

Use this file in Cursor to build the remaining product features in small focused batches.

## Global Instruction for Every Batch

Before coding, inspect the existing project structure first. Reuse existing components, routes, models, migrations, services, layouts, helpers, and UI patterns. Do not rebuild from scratch. Keep changes focused on the current batch only.

Design standard:
- Clean professional SaaS UI
- Baby-pink luxury theme without making it childish
- Shadcn UI
- Tailwind CSS
- Lucide icons
- Recharts for charts
- Plus Jakarta Sans or Inter
- Rounded 2xl cards
- Soft borders
- Clear spacing
- Searchable selects instead of repeated manual typing
- Loading states
- Empty states
- Toast feedback
- Mobile responsive screens

Core platform rules:
- Multi-tenant SaaS
- Tenant-scoped data
- Role-based access control
- Clean API responses
- Secure validation
- Reusable frontend components
- Laravel service classes for complex logic
- Do not duplicate files or logic

---

# Phase 3: Growth and Operations Features

## Batch 11: MNotify SMS and Email Notifications

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 11 only.

Build MNotify SMS and email notifications.

Features:
- MNotify SMS service
- SMS logs
- Tenant SMS usage tracking
- Queue jobs for sending SMS
- Email templates
- Notification settings page

SMS use cases:
- OTP
- Booking confirmation
- Booking reminder
- Cancellation notice
- Payment alert
- Marketing message foundation

Requirements:
- Keep API keys in env
- Store all SMS attempts
- Store success/failure status
- Tenant users only see their own SMS logs
- Super Admin can see platform-wide SMS usage
- Use clean Shadcn UI for settings and logs

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 12.
```

Acceptance criteria:
- SMS service exists
- SMS logs are saved
- Tenant SMS usage is tracked
- Notifications are queued
- UI is clean and usable

---

## Batch 12: Reports, Charts and Analytics

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 12 only.

Build reports, charts, and analytics.

Use:
- Recharts
- Shadcn UI
- Existing booking, payment, customer, staff, service, tenant, and SMS data

Reports:
- Revenue
- Bookings
- Customers
- Staff performance
- Popular services
- Payment status
- SMS usage
- Tenant growth for Super Admin
- Subscription MRR for Super Admin

Filters:
- Date range
- Branch
- Staff
- Service
- Status

Requirements:
- Tenant users see tenant-scoped analytics only
- Super Admin sees platform-wide analytics
- Charts should look clean, modern, and readable
- Use baby-pink accents carefully
- Add empty states when no data exists

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 13.
```

Acceptance criteria:
- Analytics dashboard works
- Charts are readable
- Filters work
- Tenant isolation is respected

---

## Batch 13: WordPress Plugin API

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 13 only.

Build WordPress plugin API support.

Backend endpoints:
- Generate tenant API key
- Validate API key
- Fetch services
- Fetch staff
- Fetch availability
- Create booking
- Redirect to payment

Plugin scaffold:
- Create wordpress-plugin folder if missing
- Add basic plugin file
- Add admin settings page
- Add API key field
- Add booking widget shortcode
- Add services shortcode

Security:
- Hash stored API keys
- Do not expose tenant private data
- Rate limit public endpoints
- Validate tenant connection

Requirements:
- Reuse existing services, staff, availability, and booking logic
- Keep plugin simple and expandable

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 14.
```

Acceptance criteria:
- Tenant can generate an API key
- WordPress plugin can connect using API key
- Services can be displayed with shortcode
- Booking widget foundation exists

---

## Batch 14: Mobile App API Preparation

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 14 only.

Prepare APIs for a future React Native mobile app.

Mobile roles:
- Super Admin
- Tenant Owner
- Staff
- Client

Tasks:
- Review existing auth APIs
- Standardize success and error responses
- Add mobile-friendly user profile endpoint
- Add mobile dashboard endpoint per role
- Add token refresh strategy if needed
- Add push notification placeholder fields
- Create /docs/mobile-api.md

Documentation should include:
- Auth flow
- Login response
- User profile response
- Role-based endpoints
- Booking endpoints
- Staff endpoints
- Client endpoints
- Error response format

Requirements:
- Do not rebuild existing features
- Keep API backwards compatible
- Make responses predictable for React Native

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 15.
```

Acceptance criteria:
- API response format is consistent
- Mobile documentation exists
- Mobile app can use current APIs later

---

## Batch 15: Final Polish and Market Readiness

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 15 only.

Polish the full app for market readiness.

Tasks:
- Review UI consistency
- Fix spacing issues
- Improve mobile responsiveness
- Add missing empty states
- Add missing loading states
- Add missing error states
- Improve accessibility
- Improve API error handling
- Improve validation messages
- Check tenant isolation
- Check role permissions
- Remove dead code
- Improve README

Do not add new major features.
Focus only on cleanup, polish, and production readiness.

Final quality target:
- Clean professional SaaS UI
- Smooth user experience
- No ugly layouts
- No broken core flows
- Clear documentation
- Production-ready structure

After finishing, summarize files changed, completed polish items, and remaining risks.
```

Acceptance criteria:
- App looks professional
- Core flows are smooth
- No major UI inconsistencies
- Code is cleaner and easier to maintain

---

# Phase 4: Advanced Business Features

## Batch 16: Inventory Management

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 16 only.

Build inventory management for tenants.

Features:
- Product categories
- Products
- SKU
- Cost price
- Selling price
- Stock quantity
- Low stock threshold
- Supplier field
- Branch-specific stock
- Stock adjustment history

UI:
- Inventory dashboard
- Product table
- Add/edit product form
- Stock adjustment modal
- Low stock alerts

Requirements:
- Tenant scoped
- Branch aware
- Clean CRUD
- Search and filters
- Empty/loading states

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 17.
```

---

## Batch 17: POS Foundation

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 17 only.

Build POS foundation for tenant businesses.

Features:
- Sell services
- Sell products from inventory
- Cart system
- Discounts
- Taxes placeholder
- Payment method selection
- Receipt generation
- Sales history

Requirements:
- Use existing services, products, customers, payments, and coupons
- Reduce inventory when product sale is completed
- Tenant scoped
- Branch aware
- Clean POS UI with large buttons and simple flow

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 18.
```

---

## Batch 18: Loyalty, Memberships and Gift Cards

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 18 only.

Build loyalty, memberships, and gift cards.

Features:
- Loyalty points rules
- Customer points balance
- Membership plans for tenant customers
- Gift card creation
- Gift card redemption
- Expiry dates
- Usage history

Requirements:
- Tenant scoped
- Integrate with bookings, POS, and payments where available
- Clean management UI
- Client portal should show points, memberships, and gift cards

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 19.
```

---

## Batch 19: Marketplace Discovery Foundation

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 19 only.

Build marketplace discovery foundation.

Features:
- Public marketplace page
- Search salons/spas/nail techs/barbers
- Filter by category, location, rating, service, and availability
- Tenant public profile cards
- Service preview
- Book now CTA

Requirements:
- Only show tenants that enabled marketplace visibility
- Use tenant branding and public data only
- Clean modern public UI
- Mobile responsive

After finishing, summarize files changed, features completed, how to test, and what remains for Batch 20.
```

---

## Batch 20: AI Assistant Foundation

Cursor prompt:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 20 only.

Build an AI assistant foundation without connecting a paid AI provider yet.

Features:
- AI assistant UI panel
- Suggested actions
- Booking summary assistant placeholder
- Marketing campaign suggestion placeholder
- No-show risk placeholder
- Business insight cards

Requirements:
- Keep provider abstraction ready for OpenAI or another provider later
- Do not hardcode fake sensitive insights
- Use safe placeholder logic based on existing analytics
- Tenant scoped
- Clean premium UI

After finishing, summarize files changed, features completed, and future AI integration points.
```

---

# Short Cursor Commands

Use these short prompts to save tokens:

```text
Read BeautyOS_Features_Build_Roadmap.md and execute Batch 11 only. Inspect existing code first. Do not rebuild from scratch.
```

```text
Continue with the next batch only from BeautyOS_Features_Build_Roadmap.md. Keep changes focused.
```

```text
Fix issues in the last batch only. Do not add new features.
```

```text
Review the current batch against its acceptance criteria and fix gaps only.
```

```text
Refactor the current batch for cleaner UI and reusable components. Do not change business logic.
```
