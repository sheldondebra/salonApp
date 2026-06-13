import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SchedeluxLogo } from "@/components/branding/schedelux-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanComparisonTable } from "@/components/pricing/plan-comparison-table";
import { plans } from "@/lib/pricing/plans";
import { loginHref, registerHref } from "@/lib/auth/auth-flow-links";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <SchedeluxLogo variant="header" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-12 text-center lg:pt-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Simple, transparent pricing
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
          Plans that grow with your salon
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
          Booking, POS, finance, SMS, and analytics — pick the tier that matches your team size and
          branches.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative flex flex-col shadow-soft",
              plan.highlighted && "border-primary ring-2 ring-primary/20"
            )}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            ) : null}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-2 text-3xl font-semibold">
                {plan.price != null ? (
                  <>
                    GHS {plan.price.toLocaleString()}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </>
                ) : (
                  "Custom"
                )}
              </p>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  Online booking widget
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  Client profiles & favorites
                </li>
                {plan.id !== "starter" ? (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" />
                    Loyalty & social login
                  </li>
                ) : null}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link
                  href={
                    plan.id === "enterprise"
                      ? "mailto:sales@salonapp.demo"
                      : registerHref({ plan: plan.id, intent: "salon" })
                  }
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {plan.id !== "enterprise" ? (
                <Link
                  href={loginHref({ plan: plan.id, intent: "salon" })}
                  className="text-center text-xs text-muted-foreground hover:text-accent hover:underline"
                >
                  Already have an account? Sign in
                </Link>
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-2 text-center text-2xl font-semibold">Compare plans</h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          See exactly what is included in Starter, Professional, and Enterprise.
        </p>
        <PlanComparisonTable />
      </section>
    </div>
  );
}
