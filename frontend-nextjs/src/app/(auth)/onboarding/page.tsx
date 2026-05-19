"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getApiClientOptions().token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (businessName && !slug) {
      setSlug(
        businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [businessName, slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        redirect: string;
        tenant: { slug: string };
      }>("/onboarding/tenant", {
        business_name: businessName,
        slug,
        tagline: tagline || undefined,
      });
      toast.success("Your salon is ready!");
      router.push(res.redirect ?? `/${res.tenant.slug}/dashboard`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/30">
      <header className="border-b border-border/60 bg-card/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <AuthBackLink href="/" label="Back to home" />
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-accent" />
            SalonApp — Set up your salon
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Onboard your business
            </CardTitle>
            <CardDescription>
              Payment complete. Name your salon and choose a workplace URL slug.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Luxe Bloom Studio"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Workplace URL</Label>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>yoursite.com/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline (optional)</Label>
                <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating workspace…" : "Launch dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
