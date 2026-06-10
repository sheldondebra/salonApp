import { formatMoney } from "@/lib/format/money";

export const CHART_AXIS = {
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
};

export const CHART_GRID = {
  strokeDasharray: "4 4",
  stroke: "hsl(var(--border) / 0.6)",
  vertical: false as const,
};

export function formatChartMoney(cents: number, currency: string) {
  const value = cents / 100;
  if (value >= 1_000_000) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatMoney(cents, currency);
}

export function ChartTooltipBox({
  label,
  value,
}: {
  label?: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label ? <p className="text-xs font-medium text-muted-foreground">{label}</p> : null}
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
