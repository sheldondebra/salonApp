import { Check, Minus } from "lucide-react";
import { comparisonRows, plans, type PlanId } from "@/lib/pricing/plans";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Included" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />;
  }
  return <span className="text-sm">{value}</span>;
}

export function PlanComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[28%]">Feature</TableHead>
            {plans.map((plan) => (
              <TableHead
                key={plan.id}
                className={cn("text-center", plan.highlighted && "bg-primary/5")}
              >
                {plan.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisonRows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium">{row.label}</TableCell>
              {plans.map((plan) => (
                <TableCell
                  key={plan.id}
                  className={cn("text-center", plan.highlighted && "bg-primary/5")}
                >
                  <CellValue value={row[plan.id as PlanId]} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
