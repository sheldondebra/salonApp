import { cn } from "@/lib/utils";

export function AuthFormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/50 p-6 shadow-soft backdrop-blur-sm sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
