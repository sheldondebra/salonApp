import { BarChart3 } from "lucide-react";

type ChartEmptyProps = {
  message?: string;
};

export function ChartEmpty({
  message = "No data for the selected period. Try a wider date range or different filters.",
}: ChartEmptyProps) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-4 text-center">
      <BarChart3 className="h-8 w-8 text-primary/40" aria-hidden />
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
