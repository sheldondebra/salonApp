import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CrudStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-lg font-normal",
        active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "text-muted-foreground"
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
