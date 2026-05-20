"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SkipToContent } from "@/components/shared/skip-to-content";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { ShellNavItem } from "./shell-types";

type AppShellProps = {
  brand: {
    title: string;
    subtitle?: string;
    href?: string;
    logo: React.ReactNode;
  };
  navItems: ShellNavItem[];
  sidebarFooter?: React.ReactNode;
  mobileTitle: string;
  mobileSubtitle?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  mainClassName?: string;
};

export function AppShell({
  brand,
  navItems,
  sidebarFooter,
  mobileTitle,
  mobileSubtitle,
  children,
  header,
  mainClassName,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <SkipToContent />
      <aside className="hidden lg:flex lg:shrink-0">
        <Sidebar brand={brand} items={navItems} footer={sidebarFooter} />
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 shadow-elevated transition-transform duration-200 lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!menuOpen}
      >
        <Sidebar
          brand={brand}
          items={navItems}
          footer={sidebarFooter}
          onNavigate={() => setMenuOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={mobileTitle}
          subtitle={mobileSubtitle ?? brand.subtitle}
          logo={brand.logo}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn("flex-1 space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-10", mainClassName)}
        >
          {header}
          {children}
        </main>
      </div>
    </div>
  );
}
