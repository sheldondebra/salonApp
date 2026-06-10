"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SkipToContent } from "@/components/shared/skip-to-content";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { ShellNavItem, ShellNavSection } from "./shell-types";

type AppShellProps = {
  brand: {
    title: string;
    subtitle?: string;
    href?: string;
    logo: React.ReactNode;
  };
  navSections?: ShellNavSection[];
  navItems?: ShellNavItem[];
  sidebarFooter?: React.ReactNode;
  mobileTitle: string;
  mobileSubtitle?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  bottomNav?: React.ReactNode;
  mainClassName?: string;
};

export function AppShell({
  brand,
  navSections,
  navItems,
  sidebarFooter,
  mobileTitle,
  mobileSubtitle,
  children,
  header,
  toolbar,
  bottomNav,
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
        <Sidebar brand={brand} sections={navSections} items={navItems} footer={sidebarFooter} />
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
          "fixed inset-y-0 left-0 z-50 overflow-hidden rounded-r-2xl shadow-elevated transition-transform duration-200 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!menuOpen}
      >
        <Sidebar
          brand={brand}
          sections={navSections}
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
          className={cn(
            "flex-1 space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-10",
            bottomNav && "pb-24 lg:pb-10",
            mainClassName
          )}
        >
          {toolbar ? <div className="hidden lg:block -mx-4 sm:-mx-6 md:-mx-10 mb-2">{toolbar}</div> : null}
          {header}
          {children}
        </main>
        {bottomNav ? (
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">{bottomNav}</div>
        ) : null}
      </div>
    </div>
  );
}
