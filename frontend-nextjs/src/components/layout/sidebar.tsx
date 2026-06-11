"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
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

function isNavItemActive(item: ShellNavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function sectionHasActiveItem(section: ShellNavSection, pathname: string) {
  return section.items.some((item) => isNavItemActive(item, pathname));
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: ShellNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isNavItemActive(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

function CollapsibleNavSection({
  section,
  pathname,
  isOpen,
  onToggle,
  onNavigate,
  forceOpen,
}: {
  section: ShellNavSection;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  forceOpen?: boolean;
}) {
  const open = forceOpen || isOpen;
  const hasActive = sectionHasActiveItem(section, pathname);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors",
          hasActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>{section.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="mt-0.5 space-y-0.5 pb-1">
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({ brand, sections, items, footer, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const navSections = useMemo<ShellNavSection[]>(
    () => sections ?? (items?.length ? [{ id: "main", label: "Menu", items, defaultOpen: true }] : []),
    [sections, items]
  );

  const totalItems = navSections.reduce((sum, section) => sum + section.items.length, 0);
  const showSearch = totalItems > 8;
  const isSearching = query.trim().length > 0;

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of navSections) {
      initial[section.id] =
        section.defaultOpen === true || sectionHasActiveItem(section, pathname);
    }
    return initial;
  });

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const section of navSections) {
        if (sectionHasActiveItem(section, pathname) && !next[section.id]) {
          next[section.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, navSections]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
        "flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-4">
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
          "sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4",
          showSearch ? "pt-3" : ""
        )}
        aria-label="Main navigation"
      >
        {filteredSections.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No menu items match your search.</p>
        ) : (
          filteredSections.map((section) => (
            <CollapsibleNavSection
              key={section.id}
              section={section}
              pathname={pathname}
              isOpen={openSections[section.id] ?? false}
              onToggle={() => toggleSection(section.id)}
              onNavigate={onNavigate}
              forceOpen={isSearching}
            />
          ))
        )}
      </nav>

      {footer ? (
        <div className="mt-auto border-t border-sidebar-border bg-sidebar-accent/20 p-3">{footer}</div>
      ) : null}
    </aside>
  );
}
