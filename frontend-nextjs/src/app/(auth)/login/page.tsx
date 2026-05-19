"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { createApiClient, ApiError } from "@/lib/api/client";
import { setAuthToken } from "@/lib/auth/session";
import { redirectPathAfterAuth } from "@/lib/auth/redirect-after-auth";
import type { User } from "@/lib/api/types";

type LoginResponse = { token: string; user: User };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || loading) return;

    submitting.current = true;
    setLoading(true);

    try {
      const res = await createApiClient().post<LoginResponse>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res?.token || !res?.user) {
        throw new ApiError("Login response was invalid. Try again.", 500);
      }

      setAuthToken(res.token);
      const next = searchParams.get("next");
      const destination = redirectPathAfterAuth(res.user, next);

      toast.success(`Welcome back, ${res.user.name}`);

      if (res.user.user_type === "tenant_owner" || res.user.user_type === "manager" || res.user.user_type === "staff") {
        toast.message("Salon workspace", {
          description: `Opening ${destination.replace(/^\//, "")} — use office@salonapp.com for platform admin.`,
        });
      }

      router.replace(destination);
      return;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign in failed";
      toast.error(message);
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      back={{ href: "/", label: "Back to home" }}
      title="Welcome back"
      subtitle="Sign in to manage bookings, loyalty, and your profile."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <AuthFormCard>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthField id="email" label="Email" icon={Mail}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              required
              disabled={loading}
            />
          </AuthField>

          <AuthField
            id="password"
            label="Password"
            icon={Lock}
            hint={
              <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                Forgot password?
              </Link>
            }
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showLockIcon={false}
              className={authInputClass}
              required
              disabled={loading}
            />
          </AuthField>

          <Button type="submit" className="h-11 w-full gap-2 text-base font-medium" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6">
          <SocialLoginButtons />
        </div>
      </AuthFormCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
