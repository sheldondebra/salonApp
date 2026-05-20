"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import type { ShellNavItem } from "./shell-types";

type SidebarProps = {
  brand: {
    title: string;
    subtitle?: string;
    href?: string;
    logo: React.ReactNode;
  };
  items: ShellNavItem[];
  footer?: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ brand, items, footer, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const brandInner = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        {brand.logo}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-sidebar-foreground">{brand.title}</p>
        {brand.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{brand.subtitle}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      <div className="flex items-center gap-3 p-6">
        {brand.href ? (
          <Link href={brand.href} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
            {brandInner}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{brandInner}</div>
        )}
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main navigation">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="mt-auto border-t border-sidebar-border p-4">{footer}</div> : null}
    </aside>
  );
}
