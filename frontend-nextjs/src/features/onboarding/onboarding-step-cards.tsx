"use client";

import {
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Image,
  MapPin,
  Palette,
  Phone,
  Scissors,
  Store,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingProgress, OnboardingStepKey } from "./types";

const STEP_ICONS: Record<OnboardingStepKey, LucideIcon> = {
  business: Building2,
  business_type: Store,
  services: Scissors,
  gallery: Image,
  contact: Phone,
  branding: Palette,
  location: MapPin,
  review: Check,
};

type OnboardingStepCardsProps = {
  stepOrder: OnboardingStepKey[];
  progress: OnboardingProgress | null;
  currentStep: OnboardingStepKey;
  onSelectStep: (step: OnboardingStepKey) => void;
  disabled?: boolean;
};

export function OnboardingStepCards({
  stepOrder,
  progress,
  currentStep,
  onSelectStep,
  disabled,
}: OnboardingStepCardsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {stepOrder.map((key) => {
        const meta = progress?.steps[key];
        const Icon = STEP_ICONS[key];
        const done = Boolean(meta?.completed);
        const active = currentStep === key;

        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSelectStep(key)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-3 text-left transition-all",
              "hover:border-accent/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              done && "border-accent/30 bg-accent/5",
              active && "border-accent bg-card shadow-soft ring-1 ring-accent/30",
              !done && !active && "border-border bg-card/60",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  done ? "bg-accent/15 text-accent" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{meta?.label ?? key.replace("_", " ")}</p>
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  done ? "text-accent" : active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {done ? "Completed" : active ? "In progress" : "Not completed"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
