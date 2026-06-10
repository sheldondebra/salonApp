import Link from "next/link";
import { Calendar, Home, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-surface via-background to-secondary/30">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Scissors className="h-5 w-5" />
          </span>
          Schedelux
        </Link>
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-lg flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="text-7xl font-bold tracking-tight text-accent/80">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
          This page does not exist, was moved, or the salon link may be incorrect. Check the URL or
          go back to a known page.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/login">
              <Calendar className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Booking a salon? Use a link like{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">/your-salon/book</code>
        </p>
      </main>
    </div>
  );
}
