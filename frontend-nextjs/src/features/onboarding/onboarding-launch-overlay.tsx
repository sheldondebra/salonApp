"use client";

import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MESSAGES = [
  "Setting up your workspace…",
  "Configuring branding…",
  "Preparing your service menu…",
  "Building your dashboard…",
  "Almost ready…",
];

type Props = {
  active: boolean;
  onDone: () => void;
};

export function OnboardingLaunchOverlay({ active, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;

    setIndex(0);
    setProgress(0);

    const msgTimer = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 900);

    const progTimer = setInterval(() => {
      setProgress((p) => Math.min(100, p + 8));
    }, 200);

    const doneTimer = setTimeout(() => {
      setProgress(100);
      clearInterval(msgTimer);
      clearInterval(progTimer);
      setTimeout(onDone, 400);
    }, 3200);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
      clearTimeout(doneTimer);
    };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <Scissors className="h-7 w-7 text-accent animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold">Launching your salon</h2>
        <p className="mt-2 text-sm text-muted-foreground">{MESSAGES[index]}</p>
        <Progress value={progress} className="mt-6" />
      </div>
    </div>
  );
}
