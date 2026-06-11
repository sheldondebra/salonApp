"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ShellNavItem, ShellNavSection } from "./shell-types";

type SidebarProps = {
  brand: {
    title: string;
    subtitle?: string;
    href?: string;
    logo: React.ReactNode;
    /** Use full horizontal logo row instead of small icon tile */
    wideLogo?: boolean;
  };
  sections?: ShellNavSection[];
  items?: ShellNavItem[];
  footer?: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
};

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: ShellNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/80"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
      )}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-primary/25 text-sidebar-accent-foreground"
            : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ brand, sections, items, footer, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const navSections: ShellNavSection[] =
    sections ??
    (items?.length ? [{ id: "main", label: "Menu", items }] : []);

  const totalItems = navSections.reduce((sum, section) => sum + section.items.length, 0);
  const showSearch = totalItems > 8;

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navSections;

    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((section) => section.items.length > 0);
  }, [navSections, query]);

  const brandInner = brand.wideLogo ? (
    <div className="min-w-0 space-y-2">
      <div className="overflow-hidden rounded-xl px-1 py-0.5">{brand.logo}</div>
      {brand.subtitle ? (
        <p className="truncate text-xs text-muted-foreground">{brand.subtitle}</p>
      ) : brand.title ? (
        <p className="truncate text-xs text-muted-foreground">{brand.title}</p>
      ) : null}
    </div>
  ) : (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft ring-1 ring-white/40">
        {brand.logo}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          {brand.title}
        </p>
        {brand.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{brand.subtitle}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <aside
      className={cn(
        "flex h-full w-[18rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      <div className="border-b border-sidebar-border/80 bg-gradient-to-b from-sidebar-accent/30 to-transparent px-4 py-4">
        {brand.href ? (
          <Link
            href={brand.href}
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-sidebar-accent/40"
          >
            {brandInner}
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3 p-2">{brandInner}</div>
        )}
      </div>

      {showSearch ? (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu…"
              className="h-9 rounded-xl border-sidebar-border bg-background/80 pl-9 text-sm shadow-none"
              aria-label="Search navigation"
            />
          </div>
        </div>
      ) : null}

      <nav
        className={cn(
          "sidebar-scroll flex-1 space-y-4 overflow-y-auto px-3 py-4",
          showSearch ? "pt-3" : ""
        )}
        aria-label="Main navigation"
      >
        {filteredSections.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No menu items match your search.</p>
        ) : (
          filteredSections.map((section) => (
            <div key={section.id}>
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {footer ? (
        <div className="mt-auto border-t border-sidebar-border bg-sidebar-accent/20 p-3">{footer}</div>
      ) : null}
    </aside>
  );
}
