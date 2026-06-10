import Link from "next/link";
import { headers } from "next/headers";
import { Calendar, Home, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantNotFound() {
  const slug = headers().get("x-tenant-slug");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-surface via-background to-secondary/30 px-6 py-16 text-center">
      <p className="text-6xl font-bold text-accent/80">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {slug
          ? `This page is not part of the ${slug} workspace. You can book an appointment or open the dashboard.`
          : "This salon workspace page does not exist or the link is wrong."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {slug ? (
          <>
            <Button asChild className="gap-2">
              <Link href={`/${slug}/book`}>
                <Calendar className="h-4 w-4" />
                Book appointment
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/${slug}/dashboard`}>
                <Scissors className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </>
        ) : null}
        <Button asChild variant={slug ? "ghost" : "default"} className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Schedelux home
          </Link>
        </Button>
      </div>
    </div>
  );
}
