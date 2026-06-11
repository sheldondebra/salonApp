import { SchedeluxLogo } from "@/components/branding/schedelux-logo";
import { AuthBackLink } from "@/components/auth/auth-back-link";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  back?: { href: string; label?: string };
};

export function AuthLayout({ title, subtitle, children, footer, back }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary/40 via-accent/30 to-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <SchedeluxLogo variant="full" priority />
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-semibold leading-tight text-balance">
            Beauty booking that feels as premium as your brand
          </h2>
          <p className="text-muted-foreground">
            Appointments, loyalty, favorites, and client profiles — unified for salons, spas, and
            wellness studios.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Schedelux</p>
        <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-10 h-48 w-48 rounded-full bg-accent/20 blur-2xl" />
      </aside>

      <main className="flex flex-col justify-center bg-gradient-to-b from-background via-brand-surface/30 to-secondary/20 px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <SchedeluxLogo variant="header" className="mb-6" priority />
          </div>
          {back ? (
            <div className="mb-6">
              <AuthBackLink href={back.href} label={back.label} />
            </div>
          ) : null}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer ? <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
