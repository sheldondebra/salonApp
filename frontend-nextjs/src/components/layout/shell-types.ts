import type { LucideIcon } from "lucide-react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match pathname exactly (default: prefix match). */
  exact?: boolean;
};

export type ShellNavSection = {
  id: string;
  label: string;
  items: ShellNavItem[];
  /** Expanded on first load when no route matches this section. */
  defaultOpen?: boolean;
};
