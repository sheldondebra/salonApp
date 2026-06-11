import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CreditCard,
  MessageSquare,
  Package,
  Scissors,
  Shield,
  Smartphone,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { SchedeluxLogo, SCHEDELUX_TAGLINE } from "@/components/branding/schedelux-logo";
import { Button } from "@/components/ui/button";
import { marketingImages } from "./marketing-images";

const DEMO_SLUG = "luxe-bloom";

const stats = [
  { value: "24/7", label: "Online booking page for every salon" },
  { value: "POS", label: "Shop checkout, inventory & retail" },
  { value: "Finance", label: "Transactions, invoices & payouts" },
  { value: "SMS", label: "Confirmations, reminders & campaigns" },
];

const pillars = [
  {
    eyebrow: "Fill your calendar",
    title: "Clients book online. Your team stays in control.",
    body: "Branded booking pages, service menus, staff selection, live availability, deposits, and WhatsApp chat — so new clients book themselves and your front desk spends less time on the phone.",
    bullets: [
      "Public booking page with your logo, hours & services",
      "Staff booking, waitlist & appointment management",
      "Payment requests & MTN MoMo checkout",
      "Booking reminders and confirmation SMS",
    ],
    image: marketingImages.booking,
    imageAlt: "Stylist working with a client in a salon",
    cta: { label: "Try the booking page", href: `/${DEMO_SLUG}/book` },
  },
  {
    eyebrow: "Sell more in-chair",
    title: "POS, products, and packages in one flow.",
    body: "Ring up services and retail from the same workplace. Track inventory, memberships, gift cards, and bundles without juggling spreadsheets or a separate till system.",
    bullets: [
      "Shop checkout (POS) for services & products",
      "Inventory, purchase orders & low-stock alerts",
      "Memberships, packages & gift cards",
      "Client profiles with visit history",
    ],
    image: marketingImages.pos,
    imageAlt: "Salon retail products on a shelf",
    cta: { label: "See the workplace", href: `/${DEMO_SLUG}/dashboard` },
  },
  {
    eyebrow: "Run the business",
    title: "Revenue, payroll-ready finance, and reports you can trust.",
    body: "Dashboards, finance ledgers, wallet balances, and staff analytics — built for owners who need clarity on what was booked, collected, and owed across every branch.",
    bullets: [
      "Dashboard & reports with revenue trends",
      "Finance: transactions, invoices, expenses & tips",
      "Schedelux wallet & payout-ready balances",
      "Staff performance, occupancy & retention views",
    ],
    image: marketingImages.team,
    imageAlt: "Salon team reviewing the day schedule",
    cta: { label: "View pricing", href: "/pricing" },
  },
];

const capabilities = [
  { icon: CalendarDays, title: "Appointments", text: "Calendar, waitlist, payments & recurring bookings." },
  { icon: Scissors, title: "Services & staff", text: "Menus, working hours, chair rentals & permissions." },
  { icon: Store, title: "Marketplace", text: "List your salon, featured placements & commissions." },
  { icon: MessageSquare, title: "Reviews & SMS", text: "Reputation, SMS wallet, and automated client messages." },
  { icon: BarChart3, title: "Analytics", text: "Goals, occupancy, retention & custom report builder." },
  { icon: Shield, title: "Roles & security", text: "Owner, manager, staff & client access out of the box." },
  { icon: Smartphone, title: "Mobile app", text: "iOS & Android app for staff and clients on the go." },
  { icon: Package, title: "Multi-branch", text: "Branches, groups, approvals & white-label branding." },
];

const audiences = ["Hair salons", "Nail studios", "Barbershops", "Spas & wellness", "Beauty clinics"];

export function MarketingHome() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <SchedeluxLogo variant="header" priority />
          <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
            <a href="#product" className="hover:text-foreground">
              Product
            </a>
            <a href="#capabilities" className="hover:text-foreground">
              Features
            </a>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-lg bg-neutral-900 text-white hover:bg-neutral-800">
              <Link href="/register">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {SCHEDELUX_TAGLINE}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-neutral-900 md:text-5xl lg:text-[3.25rem]">
              Everything your salon needs to book, sell, and grow.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
              Schedelux is a multi-tenant platform for beauty businesses — online booking, workplace
              operations, POS, finance, SMS, and analytics in one place. No patchwork of apps.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="rounded-lg bg-neutral-900 hover:bg-neutral-800">
                <Link href="/register">Start free trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-lg border-neutral-300">
                <Link href={`/${DEMO_SLUG}/book`}>Book a live demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Demo workspace:{" "}
              <Link href={`/${DEMO_SLUG}/dashboard`} className="font-medium text-neutral-800 underline-offset-2 hover:underline">
                {DEMO_SLUG}
              </Link>
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
            <Image
              src={marketingImages.hero}
              alt="Modern salon interior with styling stations"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold text-neutral-900">{item.value}</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            One platform. Three jobs done right.
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Schedelux replaces the booking link, the back-office spreadsheet, and the separate POS —
            with modules that already share clients, staff, and payments.
          </p>
        </div>

        <div className="mt-14 space-y-20">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                <Image
                  src={pillar.image}
                  alt={pillar.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  {pillar.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
                  {pillar.title}
                </h3>
                <p className="mt-4 leading-relaxed text-neutral-600">{pillar.body}</p>
                <ul className="mt-6 space-y-3">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm text-neutral-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-8 rounded-lg border-neutral-300">
                  <Link href={pillar.cta.href}>
                    {pillar.cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Mobile + web
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
              Your team works from the chair. You run the business from anywhere.
            </h2>
            <p className="mt-4 leading-relaxed text-neutral-600">
              Staff use the Schedelux mobile app for bookings, clients, and POS. Owners get the full
              workplace on desktop — dashboard, finance, settings, and reports without desktop-only
              lock-in.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Workplace web app", "Expo mobile app", "Client booking page", "Admin platform"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
            <Image
              src={marketingImages.mobile}
              alt="Business owner using a smartphone"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Built for real salon operations</h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
            Every module below exists in the product today — not a roadmap slide.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-neutral-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <Icon className="h-5 w-5 text-neutral-800" />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200">
              <Image
                src={marketingImages.spa}
                alt="Spa treatment room"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">Made for your type of business</h2>
              <p className="mt-4 text-neutral-600">
                Whether you run a single chair or a multi-branch group, each tenant gets a branded
                workspace, role-based team access, and a client-facing booking page on your own URL.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {audiences.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <ul className="mt-8 space-y-2 text-sm text-neutral-700">
                <li className="flex gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0" />
                  Owner, manager, staff & client roles with permissions
                </li>
                <li className="flex gap-2">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
                  Wallet, payment gateways & finance reconciliation
                </li>
                <li className="flex gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0" />
                  White-label branding, custom domains & marketplace listing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:py-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Stop stitching tools together. Start with Schedelux.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-300">
            Launch your branded booking page, invite your team, and run your first appointment this
            week. Plans start at GHS 99/month.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="rounded-lg bg-white text-neutral-900 hover:bg-neutral-100">
              <Link href="/register">Create your salon workspace</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-lg border-neutral-600 bg-transparent text-white hover:bg-neutral-800"
            >
              <Link href="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <SchedeluxLogo variant="header" />
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Schedelux. Beauty booking software for growing teams.
          </p>
          <div className="flex gap-6 text-sm text-neutral-600">
            <Link href="/login" className="hover:text-neutral-900">
              Sign in
            </Link>
            <Link href="/pricing" className="hover:text-neutral-900">
              Pricing
            </Link>
            <Link href={`/${DEMO_SLUG}/book`} className="hover:text-neutral-900">
              Live demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
