"use client";

import { evaluatePasswordStrength } from "@/lib/auth/password-strength";
import { cn } from "@/lib/utils";

export function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = evaluatePasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", score >= level ? color : "bg-muted")}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Password strength: {label}</p>
    </div>
  );
}
