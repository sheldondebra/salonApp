import Link from "next/link";
import { ArrowRight, Calendar, Scissors, Users, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Online booking",
    description: "Beautiful client booking flows with staff, service, and time selection.",
  },
  {
    icon: Users,
    title: "Multi-tenant workspaces",
    description: "Each salon gets its own branded workplace at workplace.yourdomain.com/slug.",
  },
  {
    icon: BarChart3,
    title: "Revenue analytics",
    description: "Track appointments, revenue trends, and team performance in real time.",
  },
  {
    icon: Shield,
    title: "Role-based access",
    description: "Super Admin, Office Admin, Owner, Manager, Staff, and Client roles built in.",
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Scissors className="h-5 w-5" />
          </span>
          Schedelux
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <a href="#portals" className="hover:text-foreground">
            Portals
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/luxe-bloom/dashboard">
              Live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center md:pt-20">
        <span className="inline-flex rounded-full border border-brand-border bg-card px-4 py-1.5 text-xs font-medium text-accent">
          Premium beauty booking SaaS
        </span>
        <h1 className="text-balance mt-6 text-4xl font-semibold tracking-tight text-brand-text md:text-6xl">
          Run your salon like a{" "}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            luxury brand
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Multi-tenant booking for salons, spas, nail techs, barbers, and wellness studios — with
          branded workplaces, analytics, and role-based teams.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/luxe-bloom/book">Book a demo appointment</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/admin">Platform admin</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-soft transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <feature.icon className="mb-4 h-8 w-8 text-accent" />
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="portals" className="border-t border-border bg-card/60 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold">Built for every portal</h2>
          <p className="mt-3 text-muted-foreground">
            Marketing · Super Admin · Tenant Dashboard · Staff · Client Booking
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            {["workplace.domain.com/acme", "/admin", "/acme/dashboard", "/acme/staff", "/acme/book"].map(
              (path) => (
                <code
                  key={path}
                  className="rounded-xl border border-brand-border bg-background px-4 py-2 text-muted-foreground"
                >
                  {path}
                </code>
              )
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Schedelux. Premium multi-tenant beauty booking.
      </footer>
    </div>
  );
}
