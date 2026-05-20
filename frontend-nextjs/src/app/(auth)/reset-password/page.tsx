"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthField, authInputClass } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { createApiClient, ApiError } from "@/lib/api/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !email) {
      toast.error("Invalid or expired reset link.");
      return;
    }
    setLoading(true);
    try {
      await createApiClient().post("/auth/reset-password", {
        token,
        email: decodeURIComponent(email),
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success("Password updated. You can sign in now.");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <AuthLayout
        back={{ href: "/forgot-password", label: "Request a new link" }}
        title="Invalid link"
        subtitle="This reset link is missing or expired."
      >
        <AuthFormCard>
          <p className="text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-accent hover:underline">
              Request a new password reset
            </Link>
          </p>
        </AuthFormCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      back={{ href: "/login", label: "Back to sign in" }}
      title="Choose a new password"
      subtitle={`Resetting password for ${decodeURIComponent(email)}`}
    >
      <AuthFormCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField id="password" label="New password" icon={KeyRound}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
              required
              disabled={loading}
            />
          </AuthField>
          <AuthField id="password_confirmation" label="Confirm password" icon={KeyRound}>
            <PasswordInput
              id="password_confirmation"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={authInputClass}
              required
              disabled={loading}
            />
          </AuthField>
          <Button type="submit" className="h-11 w-full gap-2" disabled={loading}>
            <KeyRound className="h-4 w-4" />
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      </AuthFormCard>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
