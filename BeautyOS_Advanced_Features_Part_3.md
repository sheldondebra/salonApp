# BeautyOS Advanced Features Roadmap - Part 3

Covers Batches 203-219: multi-location reporting, marketing integrations, marketplace, enterprise operations, and white label.

Use one batch at a time in Cursor. Always inspect existing code first. Do not rebuild from scratch.

## Global Rules
Every batch must include Laravel backend API, web frontend, mobile phone UI, and mobile tablet/iPad UI where relevant.

UI must be 100% responsive, app-like on phone/tablet, clean, modern, easy for non-technical users, and fast.

Use Shadcn UI, React Native, Lucide icons, Recharts, smart selects, modern calendar where needed, mobile cards, tablet split views, empty/loading/error states.

Performance: lazy-load heavy pages, paginate large lists, debounce search, cache reference data, optimize images, avoid mobile table overflow.

---

## Batch 203 - Multi-Location Comparison
Build branch comparison APIs for revenue, staff performance, service performance, and booking volume.

UI: comparison charts, ranking tables, mobile branch cards, tablet dashboard.

## Batch 204 - Google Analytics Integration
Store GA measurement ID, track booking page events, conversions, and consent-aware tracking.

UI: integration settings, test placeholder, event list, mobile status.

## Batch 205 - Meta Pixel Integration
Store Meta Pixel ID, track lead/booking/purchase events, consent-aware tracking.

UI: Meta Pixel settings, event toggles, mobile status.

## Batch 206 - Abandoned Booking Recovery
Detect incomplete booking sessions, send SMS/email/WhatsApp reminders, and track recovery analytics.

UI: abandoned bookings page, automation settings, mobile follow-up alert, tablet dashboard.

## Batch 207 - Rebooking Prompts
Build suggested rebooking rules by service, auto reminders, staff/service-based rules.

UI: rebooking settings, client suggestions, mobile rebook action.

## Batch 208 - Social Booking Links
Store social links, generate shareable booking links, QR placeholder, track source.

UI: Instagram/Facebook/TikTok booking links, copy/share, mobile quick share.

## Batch 209 - Marketplace Business Profiles
Build marketplace profiles with publish/unpublish, photos, categories, services, reviews, location.

UI: profile editor, public profile, mobile preview, tablet management.

## Batch 210 - Location-Based Search
Store coordinates, search nearby businesses, distance filters, map placeholder.

UI: marketplace search, business cards, mobile nearby search, tablet results/map.

## Batch 211 - Service & Category Search
Search services by name/category/price/rating/availability.

UI: category search, filters, mobile filter bottom sheet, tablet sidebar.

## Batch 212 - Featured Listings
Build featured placements, sponsored badges, billing placeholder, placement schedule.

UI: featured listing management, sponsored display, mobile badge.

## Batch 213 - Marketplace Commission
Build commission rules, booking source tracking, commission reports, tenant invoice placeholder.

UI: commission settings, reports, mobile revenue summary.

## Batch 214 - Client App Discovery & Favorites
Build favorite businesses/staff, recently viewed, rebook favorite service.

UI: client favorites, mobile favorites tab, tablet dashboard.

## Batch 215 - Rent-a-Chair / Booth Rental
Build chair rental staff type, rental fees, schedule, reports.

UI: rental setup, chair rental calendar, mobile rental staff view.

## Batch 216 - Self-Employed Staff Support
Build independent staff profiles, own payout settings, commission/rent rules, staff-level financial reports.

UI: self-employed staff settings, mobile earnings/payout view.

## Batch 217 - Advanced Multi-Location Controls
Build regional managers, branch groups, central settings, branch overrides.

UI: regions/branch groups, override settings, mobile branch switcher, tablet operations view.

## Batch 218 - Enterprise Approvals
Build approval workflows for refunds, discounts, payroll, purchase orders, wallet adjustments.

UI: approval inbox, approve/reject detail, mobile urgent approvals, tablet queue/detail.

## Batch 219 - White Label Controls
Build white-label settings, app name placeholder, custom mobile theme, custom domain controls, plan-based access.

UI: white label settings, theme preview, mobile branded preview.

---

## Final Performance & UX Review
After Batch 219:
- Check responsive web, phone, tablet, iPad.
- Check app-like mobile behavior.
- Check calendar performance.
- Check chart loading.
- Check list pagination.
- Check image optimization.
- Check empty/loading/error states.
- Check non-technical language.
- Check accessibility.
- Check route permissions.
- Check tenant isolation.
