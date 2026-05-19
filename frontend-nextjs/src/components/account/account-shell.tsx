"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Heart, Sparkles, User, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/auth/session";
import { useRouter } from "next/navigation";

const nav = [
  { href: "profile", label: "Profile", icon: User },
  { href: "bookings", label: "Booking history", icon: Calendar },
  { href: "favorites", label: "Favorites", icon: Heart },
  { href: "loyalty", label: "Loyalty points", icon: Gift },
] as const;

type AccountShellProps = {
  tenantSlug: string;
  tenantName: string;
  children: React.ReactNode;
};

export function AccountShell({ tenantSlug, tenantName, children }: AccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${tenantSlug}/account`;

  function signOut() {
    clearAuthToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={`/${tenantSlug}/book`} className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            {tenantName}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${tenantSlug}/book`}>Book again</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto md:flex-col md:gap-1">
          {nav.map((item) => {
            const href = `${base}/${item.href}`;
            const active = pathname === href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
