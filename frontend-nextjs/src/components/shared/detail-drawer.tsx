"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DetailDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Full-width bottom sheet on mobile, right drawer on md+ */
  variant?: "drawer" | "sheet";
};

export function DetailDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  className,
  variant = "drawer",
}: DetailDrawerProps) {
  if (!open) return null;

  const isSheet = variant === "sheet";

  return (
    <div className="fixed inset-0 z-50 flex bg-foreground/20 backdrop-blur-sm md:justify-end">
      <button type="button" className="hidden flex-1 md:block" aria-label="Close panel" onClick={onClose} />
      <aside
        className={cn(
          "flex max-h-[100dvh] flex-col border-border bg-card shadow-elevated",
          isSheet
            ? "fixed inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-2xl border-t md:relative md:inset-auto md:max-h-full md:w-full md:max-w-md md:rounded-none md:border-l md:border-t-0"
            : "h-full w-full max-w-md border-l md:ml-auto",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-border p-5">{footer}</div> : null}
      </aside>
    </div>
  );
}
