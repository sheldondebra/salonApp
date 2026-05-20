"use client";

import { Button } from "@/components/ui/button";

type ConfirmActionProps = {
  label: string;
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  variant?: "ghost" | "outline" | "destructive";
  disabled?: boolean;
};

export function ConfirmAction({
  label,
  confirmMessage,
  onConfirm,
  variant = "ghost",
  disabled,
}: ConfirmActionProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className="rounded-lg"
      disabled={disabled}
      onClick={async () => {
        if (!window.confirm(confirmMessage)) return;
        await onConfirm();
      }}
    >
      {label}
    </Button>
  );
}
