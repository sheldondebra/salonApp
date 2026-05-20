import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
};

/** Primary KPI card for dashboards — baby-pink accent, soft shadow. */
export function MetricCard({ title, value, hint, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden rounded-2xl border-border/60 shadow-soft", className)}>
      <CardContent className="flex h-full min-h-[7.5rem] items-start justify-between p-5 sm:p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          {trend ? <p className="mt-2 text-xs font-medium text-emerald-600">{trend}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
