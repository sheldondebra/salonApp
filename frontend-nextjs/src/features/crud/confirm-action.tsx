"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmActionProps = {
  label: string;
  confirmMessage: string;
  title?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "ghost" | "outline" | "destructive";
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
  confirmLabel?: string;
};

export function ConfirmAction({
  label,
  confirmMessage,
  title = "Confirm action",
  onConfirm,
  variant = "ghost",
  disabled,
  className,
  icon: Icon,
  confirmLabel,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        className={cn("rounded-lg", className)}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => void handleConfirm()}
            >
              {busy ? "Working…" : (confirmLabel ?? label)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
