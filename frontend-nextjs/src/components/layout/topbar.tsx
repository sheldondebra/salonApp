"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopbarProps = {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  menuOpen: boolean;
  onMenuToggle: () => void;
  className?: string;
  trailing?: React.ReactNode;
};

export function Topbar({
  title,
  subtitle,
  logo,
  menuOpen,
  onMenuToggle,
  className,
  trailing,
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onMenuToggle}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        {logo ? <div className="shrink-0">{logo}</div> : null}
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{title}</p>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  );
}
