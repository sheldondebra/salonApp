"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Service } from "@/lib/api/types";
import { formatMoney } from "./booking-helpers";
import { cn } from "@/lib/utils";

type BookingServicePickerProps = {
  services: Service[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  currency?: string;
};

export function BookingServicePicker({
  services,
  selectedIds,
  onToggle,
  currency = "USD",
}: BookingServicePickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category?.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [services, query]);

  return (
    <div className="space-y-4">
      <Label className="text-base">Services — pick one or more</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          className="rounded-xl pl-9"
        />
      </div>
      <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-border/60 p-3 sm:max-h-[32rem] sm:p-4 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:max-h-[36rem]">
        {filtered.length === 0 ? (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No services match your search.
          </p>
        ) : (
          filtered.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <label
                key={s.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-colors",
                  checked ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => onToggle(s.id)}
                />
                <span className="flex-1 text-sm">
                  <span className="font-medium">{s.name}</span>
                  {s.category?.name ? (
                    <span className="ml-2 text-xs text-muted-foreground">{s.category.name}</span>
                  ) : null}
                  <span className="mt-0.5 block text-muted-foreground">
                    {formatMoney(s.price_cents, currency)} · {s.duration_minutes} min
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
