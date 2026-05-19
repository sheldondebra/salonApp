"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Phone, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthBar } from "@/components/auth/password-strength-bar";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { createApiClient, ApiError } from "@/lib/api/client";
import { setAuthToken } from "@/lib/auth/session";
import { redirectPathAfterAuth } from "@/lib/auth/redirect-after-auth";
import { plans } from "@/lib/pricing/plans";
import type { User as UserType } from "@/lib/api/types";

type RegisterResponse = { token: string; user: UserType; next?: string };

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "professional";
  const isSalon = searchParams.get("intent") !== "client";
  const planMeta = plans.find((p) => p.id === planParam);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await createApiClient().post<RegisterResponse>("/auth/register", {
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirmation,
        marketing_opt_in: marketing,
        account_intent: isSalon ? "salon_owner" : "client",
        plan: isSalon ? planParam : undefined,
      });
      setAuthToken(res.token);
      toast.success("Account created");
      router.push(res.next ?? redirectPathAfterAuth(res.user));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const backHref = isSalon ? "/pricing" : "/login";
  const backLabel = isSalon ? "Back to pricing" : "Back to sign in";

  return (
    <AuthLayout
      back={{ href: backHref, label: backLabel }}
      title={isSalon ? "Create your salon account" : "Create your account"}
      subtitle={
        isSalon && planMeta
          ? `Sign up for ${planMeta.name} — payment is the next step.`
          : "Book appointments, earn loyalty points, and save favorite stylists."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthFormCard>
        {isSalon && planMeta ? (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm">
            <span className="font-medium text-foreground">{planMeta.name}</span>
            <span className="text-muted-foreground"> · ${planMeta.price}/mo after signup</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField id="name" label="Full name" icon={User}>
            <Input
              id="name"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={authInputClass}
              required
            />
          </AuthField>

          <AuthField id="email" label="Email" icon={Mail}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@salon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              required
            />
          </AuthField>

          <AuthField id="phone" label="Phone (optional)" icon={Phone}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={authInputClass}
            />
          </AuthField>

          <div className="space-y-2">
            <AuthField id="password" label="Password" icon={Lock}>
              <PasswordInput
                id="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showLockIcon={false}
                className={authInputClass}
                required
              />
            </AuthField>
            <PasswordStrengthBar password={password} />
          </div>

          <AuthField id="password_confirmation" label="Confirm password" icon={Lock}>
            <PasswordInput
              id="password_confirmation"
              placeholder="Re-enter your password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              showLockIcon={false}
              className={authInputClass}
              required
            />
          </AuthField>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-border accent-accent"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            <span className="text-muted-foreground">Send me offers and product updates</span>
          </label>

          <Button type="submit" className="h-11 w-full gap-2 text-base font-medium" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account…" : isSalon ? "Continue to payment" : "Create account"}
          </Button>
        </form>

        {!isSalon ? (
          <div className="mt-6">
            <SocialLoginButtons />
          </div>
        ) : null}
      </AuthFormCard>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-muted-foreground">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
