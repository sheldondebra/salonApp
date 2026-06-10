import { cn } from "@/lib/utils";

/** Full-width page content column — use on every workplace page. */
export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full min-w-0 space-y-6", className)}>{children}</div>;
}

/** Standard inner card for page sections — consistent width and styling. */
export function PageSectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-2xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Sidebar + main content split used by services, inventory, finance, settings, etc. */
export function SplitPageLayout({
  sidebar,
  children,
  className,
}: {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  if (!sidebar) {
    return <div className={cn("w-full space-y-4", className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "grid w-full gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start",
        className
      )}
    >
      <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">{sidebar}</div>
      <div className="min-w-0 w-full space-y-4">{children}</div>
    </div>
  );
}
