"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEntityLookups } from "@/hooks/use-entity-lookups";
import type { Location, StaffMember } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type BaseSelectProps = {
  tenantSlug: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowAll?: boolean;
  allLabel?: string;
};

type StaffSelectProps = BaseSelectProps & {
  items?: StaffMember[];
  optionalLabel?: string;
  optionalValue?: string;
};

export function StaffSelect({
  tenantSlug,
  value,
  onValueChange,
  placeholder = "Select staff",
  disabled,
  className,
  allowAll,
  allLabel = "All staff",
  items: itemsOverride,
  optionalLabel,
  optionalValue = "__any__",
}: StaffSelectProps) {
  const { staff } = useEntityLookups(tenantSlug);
  const items = itemsOverride ?? staff.items;
  const loading = itemsOverride ? false : staff.loading;
  const selectValue = optionalLabel && !value ? optionalValue : value;

  return (
    <Select value={selectValue} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger className={cn("min-h-touch", className)}>
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {optionalLabel ? <SelectItem value={optionalValue}>{optionalLabel}</SelectItem> : null}
        {allowAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {items.map((member) => (
          <SelectItem key={member.id} value={String(member.id)}>
            {member.title ? `${member.display_name} · ${member.title}` : member.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ServiceSelect({
  tenantSlug,
  value,
  onValueChange,
  placeholder = "Select service",
  disabled,
  className,
  allowAll,
  allLabel = "All services",
}: BaseSelectProps) {
  const { services } = useEntityLookups(tenantSlug);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || services.loading}>
      <SelectTrigger className={cn("min-h-touch", className)}>
        <SelectValue placeholder={services.loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {services.items.map((service) => (
          <SelectItem key={service.id} value={String(service.id)}>
            {service.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type BranchSelectProps = BaseSelectProps & {
  items?: Location[];
};

export function BranchSelect({
  tenantSlug,
  value,
  onValueChange,
  placeholder = "Select branch",
  disabled,
  className,
  allowAll,
  allLabel = "All branches",
  items: itemsOverride,
}: BranchSelectProps) {
  const { branches } = useEntityLookups(tenantSlug);
  const items = itemsOverride ?? branches.items;
  const loading = itemsOverride ? false : branches.loading;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger className={cn("min-h-touch", className)}>
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {items.map((branch) => (
          <SelectItem key={branch.id} value={String(branch.id)}>
            {branch.label || branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type CustomerSelectProps = {
  tenantSlug: string;
  value: string;
  onValueChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onCustomerPick?: (client: { id: number; name: string; email: string; phone: string | null } | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function CustomerSelect({
  tenantSlug,
  value,
  onValueChange,
  searchQuery,
  onSearchQueryChange,
  onCustomerPick,
  placeholder = "Select customer",
  disabled,
  className,
}: CustomerSelectProps) {
  const { customers, searchCustomers } = useEntityLookups(tenantSlug);

  function handleChange(id: string) {
    onValueChange(id);
    const client = customers.items.find((c) => String(c.id) === id) ?? null;
    onCustomerPick?.(client);
  }

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={disabled}
      onOpenChange={(open) => {
        if (open && searchQuery.trim().length >= 2) void searchCustomers(searchQuery);
      }}
    >
      <SelectTrigger className={cn("min-h-touch", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="border-b border-border p-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              onSearchQueryChange(e.target.value);
              if (e.target.value.trim().length >= 2) void searchCustomers(e.target.value);
            }}
            placeholder="Search customers…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        {customers.loading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
        ) : customers.items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {searchQuery.trim().length >= 2 ? "No customers found" : "Type at least 2 characters"}
          </div>
        ) : (
          customers.items.map((client) => (
            <SelectItem key={client.id} value={String(client.id)}>
              {client.name}
              {client.phone ? ` · ${client.phone}` : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
