import Link from "next/link";
import { ArrowRight, Check, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanComparisonTable } from "@/components/pricing/plan-comparison-table";
import { plans } from "@/lib/pricing/plans";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Scissors className="h-5 w-5" />
          </span>
          SalonApp
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-4 text-center">
        <span className="inline-flex rounded-full border border-brand-border bg-card px-4 py-1.5 text-xs font-medium text-accent">
          Simple, transparent pricing
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          Plans that grow with your salon
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Online booking, client accounts, loyalty, social login, and analytics — pick the tier that
          fits your team.
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
            <CardFooter>
              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link
                  href={
                    plan.id === "enterprise"
                      ? "mailto:sales@salonapp.demo"
                      : `/register?plan=${plan.id}&intent=salon`
                  }
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
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
