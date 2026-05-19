"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthField, authInputClass } from "@/components/auth/auth-field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    toast.message("Password reset", {
      description: "Reset links are coming soon. Contact your salon for help in the meantime.",
    });
  }

  return (
    <AuthLayout
      back={{ href: "/login", label: "Back to sign in" }}
      title="Reset your password"
      subtitle={sent ? "Check your inbox for a reset link." : "Enter your email and we will send reset instructions."}
    >
      <AuthFormCard>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-accent">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong className="text-foreground">{email}</strong>, you will receive an email
              shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
              />
            </AuthField>
            <Button type="submit" className="h-11 w-full gap-2">
              <Send className="h-4 w-4" />
              Send reset link
            </Button>
          </form>
        )}
      </AuthFormCard>
    </AuthLayout>
  );
}
