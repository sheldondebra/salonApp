export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Enter a password", color: "bg-muted" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const normalized = Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;

  const map: Record<number, Omit<PasswordStrength, "score">> = {
    1: { label: "Weak", color: "bg-red-400" },
    2: { label: "Fair", color: "bg-amber-400" },
    3: { label: "Good", color: "bg-accent" },
    4: { label: "Strong", color: "bg-emerald-500" },
  };

  return { score: normalized, ...map[normalized] };
}
