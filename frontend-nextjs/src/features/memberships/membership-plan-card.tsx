"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format/money";
import type { MembershipPlan } from "@/lib/api/types";

type MembershipPlanCardProps = {
  plan: MembershipPlan;
  currency: string;
};

export function MembershipPlanCard({ plan, currency }: MembershipPlanCardProps) {
  return (
    <Card className="h-full rounded-2xl border-border/60 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{plan.name}</CardTitle>
            <CardDescription className="mt-1">
              {plan.description || "Recurring membership plan"}
            </CardDescription>
          </div>
          <Badge variant={plan.is_active ? "default" : "secondary"}>
            {plan.is_active ? "Active" : "Draft"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              {formatMoney(plan.price_cents, currency)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              billed {String(plan.billing_interval).replace(/_/g, " ")}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{plan.active_memberships_count ?? 0} active members</p>
            <p>{plan.visits_included ?? 0} visits included</p>
          </div>
        </div>

        {(plan.service_discount_percent || plan.product_discount_percent) ? (
          <div className="flex flex-wrap gap-2">
            {plan.service_discount_percent ? (
              <Badge variant="outline">{plan.service_discount_percent}% service discount</Badge>
            ) : null}
            {plan.product_discount_percent ? (
              <Badge variant="outline">{plan.product_discount_percent}% retail discount</Badge>
            ) : null}
          </div>
        ) : null}

        {plan.perks?.length ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {plan.perks.slice(0, 3).map((perk) => (
              <li key={perk}>• {perk}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
