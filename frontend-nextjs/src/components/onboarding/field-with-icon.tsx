import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldWithIconProps = {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function FieldWithIcon({ label, icon: Icon, children, className }: FieldWithIconProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </Label>
      {children}
    </div>
  );
}
