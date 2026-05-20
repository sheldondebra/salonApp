"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            An unexpected error occurred. You can try again or return home.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="gap-2 rounded-xl" onClick={() => reset()}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
