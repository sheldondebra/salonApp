"use client";

import {
  Bath,
  Droplets,
  Hand,
  Palette,
  ScanFace,
  Scissors,
  Store,
  User,
  Waves,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BusinessTypeOption = {
  key: string;
  label: string;
  description: string;
  icon?: string;
};

const ICON_MAP: Record<string, LucideIcon> = {
  scissors: Scissors,
  bath: Bath,
  hand: Hand,
  palette: Palette,
  user: User,
  waves: Waves,
  "scan-face": ScanFace,
  droplets: Droplets,
  store: Store,
};

type BusinessTypePickerProps = {
  options: BusinessTypeOption[];
  value: string[];
  onChange: (keys: string[]) => void;
};

export function BusinessTypePicker({ options, value, onChange }: BusinessTypePickerProps) {
  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select all that apply — we will combine categories and suggest services for each.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = value.includes(opt.key);
          const Icon = ICON_MAP[opt.icon ?? "store"] ?? Store;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggle(opt.key)}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all",
                selected
                  ? "border-accent bg-accent/10 shadow-soft"
                  : "border-border bg-card hover:border-accent/40 hover:bg-muted/30"
              )}
            >
              {selected ? (
                <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-accent" />
              ) : null}
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <p className="pr-6 font-semibold text-foreground">{opt.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
