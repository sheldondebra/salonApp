import { ReactNode } from "react";

type PortalShellProps = {
  title: string;
  description: string;
  badge: string;
  children?: ReactNode;
};

export function PortalShell({ title, description, badge, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/40">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <span className="mb-4 inline-flex w-fit rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary">
          {badge}
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </div>
  );
}
