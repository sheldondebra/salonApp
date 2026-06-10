# BeautyOS Advanced Features Roadmap - Part 1

Covers Batches 166-184: Client records, digital forms, advanced calendar, POS checkout, and loyalty foundation.

Use one batch at a time in Cursor. Always inspect existing code first. Do not rebuild from scratch.

## Global Rules
Every batch must include Laravel backend API, web frontend, mobile phone UI, and mobile tablet/iPad UI.

UI must be 100% responsive, app-like on mobile/tablet, simple for non-technical users, modern, clean, and fast-loading.

Use Shadcn UI, React Native, Lucide icons, Recharts, smart searchable selects, rounded controls, skeleton loaders, empty states, toast feedback, confirmation dialogs, and modern calendar UI where scheduling is involved.

Performance rules: paginate large data, debounce search, lazy-load heavy charts/calendars, cache safe dropdown data, optimize images, and use mobile cards instead of desktop tables.

---

## Batch 166 - Client Profile Upgrade
Build advanced client profiles with visit history, allergies, patch tests, treatment records, before/after photos, documents, notes, preferences, payments, messages, loyalty, and timeline.

UI: profile tabs on web, app-like collapsible profile on phone, split view on tablet, cards for total spend, last visit, next booking, no-show count.

## Batch 167 - Digital Form Builder
Build form templates, fields, submissions, conditional question foundation, required fields, and template library.

UI: form builder, preview, field icons, rounded checkboxes, switches, mobile step-by-step form, tablet builder/preview split view.

## Batch 168 - E-Signatures & Consent Storage
Build signature pad, signed consent history, immutable signed records, downloadable PDF placeholder, and audit logs.

UI: finger signature pad on mobile, signed consent viewer, timeline, tablet preview.

## Batch 169 - Service-Based Forms
Attach forms to services and appointments. Require forms before booking/check-in and show completion status.

UI: Service > Forms tab, required badges, appointment forms panel, mobile client/staff form completion.

## Batch 170 - Resources, Rooms, Chairs & Stations
Build resources for rooms, chairs, stations, equipment, beds, booths, resource availability, service requirements, and conflict prevention.

UI: resource page, resource calendar, modern rounded event blocks, phone resource list, tablet resource schedule.

## Batch 171 - Waitlist System
Build waitlist entries, preferred staff/date/time, priority, opening detection, notify client placeholder, convert waitlist to booking.

UI: waitlist list, match openings, mobile quick add, tablet waitlist/calendar split.

## Batch 172 - Group & Couples Bookings
Support multi-client, couples spa bookings, grouped bookings, multiple staff/resources, participant cards, and conflict validation.

UI: single/couple/group booking flow, mobile wizard, tablet split layout.

## Batch 173 - Service Add-Ons
Build add-ons per service with extra price/duration and support in booking/checkout.

UI: add-ons as selectable cards, price/duration visible, mobile rounded cards, tablet grid.

## Batch 174 - Cancellation & No-Show Protection
Build cancellation policies, late cancellation fee, no-show fee, deposit rules, warning messages, no-show action, and audit logs.

UI: simple policy settings, booking warnings, mobile no-show action, tablet policy panel.

## Batch 175 - Client Self-Rescheduling Rules
Build secure reschedule links, reschedule deadline, max attempts, same staff/service rules, and admin override.

UI: clean reschedule calendar, client mobile flow, tablet reschedule calendar.

## Batch 176 - Smart Checkout Cart
Build checkout sessions with services, products, add-ons, tips, taxes, discounts, payment methods, and receipt.

UI: web checkout with cart panel, mobile cart bottom sheet and big pay button, tablet items left/cart right.

## Batch 177 - Split & Partial Payments
Support multiple payments per invoice/checkout, cash + MoMo + card + USSD, balance due, and payment allocation.

UI: split payment modal, remaining balance card, mobile step-by-step add payment.

## Batch 178 - Gift Card Redemption at Checkout
Build gift card lookup, balance validation, expiry validation, partial redemption, and ledger.

UI: gift card input/select, balance display, mobile scan/enter code, tablet redemption panel.

## Batch 179 - Membership & Package Redemption
Apply membership benefits and redeem package sessions/credits at checkout.

UI: entitlement cards, apply button, remaining sessions visible, mobile client entitlement card.

## Batch 180 - Refunds, Exchanges & Corrections
Build full/partial refunds, product exchanges, service corrections, manager approval, gateway refund placeholder, and audit logs.

UI: refund modal, reason required, approval status, mobile refund request, tablet refund panel.

## Batch 181 - Product Upsells at Checkout
Build recommended products by service, popular products, and one-click add to cart.

UI: checkout suggestions, product cards, swipeable mobile upsells, tablet product grid.

## Batch 182 - Loyalty Points
Build earn/redeem rules, expiry, manual adjustment, and loyalty ledger.

UI: loyalty settings, client balance, checkout redemption, mobile loyalty card.

## Batch 183 - Loyalty Tiers
Build Bronze/Silver/Gold/VIP tiers, auto-upgrade, benefits, and progress bar.

UI: tier cards, client badge, progress bar, tablet tier analytics.

## Batch 184 - Referral Program
Build referral codes, rewards, tracking, and fraud prevention placeholder.

UI: referral settings, client referral code, mobile share code, tablet analytics.
