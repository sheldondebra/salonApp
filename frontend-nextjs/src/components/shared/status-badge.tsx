import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const toneClasses: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  neutral: "border-border bg-muted/50 text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  className?: string;
};

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium capitalize", toneClasses[tone], className)}>
      {label}
    </Badge>
  );
}

export function activeStatusTone(active: boolean): StatusTone {
  return active ? "success" : "neutral";
}
