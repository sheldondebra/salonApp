"use client";

import { Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/features/booking/booking-helpers";
import type { Service } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type PublicServicesSectionProps = {
  services: Service[];
  currency?: string;
  className?: string;
};

export function PublicServicesSection({
  services,
  currency = "USD",
  className,
}: PublicServicesSectionProps) {
  if (services.length === 0) return null;

  const featured = services.slice(0, 8);

  return (
    <section className={cn("space-y-3", className)} aria-labelledby="services-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="services-heading" className="text-base font-semibold tracking-tight">
            Services
          </h3>
          <p className="text-sm text-muted-foreground">
            {services.length} available — choose any combination when you book
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
          <a href="#book">Book now</a>
        </Button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {featured.map((service) => (
          <li key={service.id}>
            <Card className="h-full rounded-xl border-border/60 shadow-soft transition-colors hover:border-accent/30">
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/25 text-accent">
                    <Scissors className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{service.name}</p>
                    {service.category?.name ? (
                      <p className="text-[11px] text-muted-foreground">{service.category.name}</p>
                    ) : null}
                  </div>
                </div>
                {service.description ? (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration_minutes} min
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(service.price_cents, currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {services.length > featured.length ? (
        <p className="text-center text-xs text-muted-foreground">
          +{services.length - featured.length} more in the booking flow
        </p>
      ) : null}
    </section>
  );
}
