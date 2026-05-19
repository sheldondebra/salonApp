"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createApiClient } from "@/lib/api/client";
import { FacebookIcon, GoogleIcon } from "@/components/auth/social-icons";
import { cn } from "@/lib/utils";

const providers = [
  {
    id: "google",
    label: "Google",
    Icon: GoogleIcon,
    className:
      "border border-border bg-white text-foreground hover:bg-muted/90 hover:text-foreground",
  },
  {
    id: "facebook",
    label: "Facebook",
    Icon: FacebookIcon,
    className:
      "border border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#166FE5] hover:text-white",
  },
] as const;

export function SocialLoginButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSocial(provider: string) {
    setLoading(provider);
    try {
      const res = await createApiClient().get<{ url: string }>(`/auth/social/${provider}/redirect`);
      window.location.href = res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${provider} sign-in unavailable`);
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card/80 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid gap-2.5">
        {providers.map((p) => {
          const Icon = p.Icon;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!!loading}
              onClick={() => handleSocial(p.id)}
              className={cn(
                "inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl text-sm font-medium shadow-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                p.className
              )}
            >
              {loading === p.id ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              ) : (
                <Icon />
              )}
              {loading === p.id ? "Connecting…" : `Continue with ${p.label}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
