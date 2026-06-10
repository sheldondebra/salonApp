"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Command, LogOut, Search, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAuthToken } from "@/lib/auth/session";
import { useSessionUser } from "@/hooks/use-session-user";
import { cn } from "@/lib/utils";

type AdminOfficeTopbarProps = {
  alertCount?: number;
  className?: string;
};

export function AdminOfficeTopbar({ alertCount = 0, className }: AdminOfficeTopbarProps) {
  const router = useRouter();
  const { user } = useSessionUser();
  const [query, setQuery] = useState("");

  const initials = useMemo(() => {
    const name = user?.name?.trim() || user?.email || "Admin";
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [user?.email, user?.name]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/admin/tenants?q=${encodeURIComponent(q)}`);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border bg-card/80 px-6 py-3 backdrop-blur",
        className
      )}
    >
      <form onSubmit={onSearchSubmit} className="relative min-w-[220px] flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tenants, slugs, owners…"
          className="rounded-xl pl-9"
          aria-label="Global tenant search"
        />
      </form>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl gap-2"
        onClick={() => window.alert("Command palette ships in a later batch.")}
      >
        <Command className="h-4 w-4" />
        <span className="hidden xl:inline">Command</span>
        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium xl:inline">⌘K</kbd>
      </Button>

      <Button type="button" variant="ghost" size="icon" className="relative rounded-xl" aria-label="Alerts">
        <Bell className="h-4 w-4" />
        {alertCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        ) : null}
      </Button>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
          {initials}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-medium">{user?.name ?? "Platform admin"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "General Office"}</p>
        </div>
        <UserCircle2 className="h-4 w-4 text-muted-foreground sm:hidden" />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-xl"
        aria-label="Sign out"
        onClick={() => {
          clearAuthToken();
          router.push("/login");
        }}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
