"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formFieldIcon } from "@/features/forms/form-field-config";
import { fieldIsVisible } from "@/features/forms/form-conditional";
import type { FormFieldDefinition } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const textareaClass =
  "flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

type FormRendererProps = {
  fields: FormFieldDefinition[];
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
  showFieldIcons?: boolean;
  className?: string;
};

export function FormRenderer({
  fields,
  answers,
  onChange,
  readOnly = false,
  showFieldIcons = false,
  className,
}: FormRendererProps) {
  const sorted = [...fields].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const visibleFields = sorted.filter((field) => fieldIsVisible(field, answers));

  return (
    <div className={cn("space-y-5", className)}>
      {visibleFields.map((field) => {
        if (field.field_type === "heading") {
          return (
            <div key={field.field_key} className="border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold text-foreground">{field.label}</h3>
              {field.help_text ? (
                <p className="mt-1 text-sm text-muted-foreground">{field.help_text}</p>
              ) : null}
            </div>
          );
        }

        const Icon = formFieldIcon(field.field_type);
        const value = answers[field.field_key];
        const disabled = readOnly || !onChange;

        return (
          <div key={field.field_key} className="space-y-2">
            <div className="flex items-center gap-2">
              {showFieldIcons ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
              <Label htmlFor={field.field_key}>
                {field.label}
                {field.is_required ? <span className="text-destructive"> *</span> : null}
              </Label>
            </div>
            {field.help_text ? (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            ) : null}

            {field.field_type === "textarea" ? (
              <textarea
                id={field.field_key}
                className={textareaClass}
                value={String(value ?? "")}
                placeholder={field.placeholder ?? undefined}
                disabled={disabled}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChange?.(field.field_key, e.target.value)
                }
              />
            ) : field.field_type === "select" ? (
              <Select
                value={value != null ? String(value) : undefined}
                onValueChange={(v) => onChange?.(field.field_key, v)}
                disabled={disabled}
              >
                <SelectTrigger id={field.field_key}>
                  <SelectValue placeholder={field.placeholder ?? "Select…"} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options?.choices ?? []).map((choice) => (
                    <SelectItem key={choice} value={choice}>
                      {choice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.field_type === "multiselect" ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                {(field.options?.choices ?? []).map((choice) => {
                  const selected = Array.isArray(value) ? value.includes(choice) : false;
                  return (
                    <label key={choice} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const current = Array.isArray(value) ? [...value] : [];
                          const next = e.target.checked
                            ? [...current, choice]
                            : current.filter((c) => c !== choice);
                          onChange?.(field.field_key, next);
                        }}
                      />
                      {choice}
                    </label>
                  );
                })}
              </div>
            ) : field.field_type === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  id={field.field_key}
                  type="checkbox"
                  checked={Boolean(value)}
                  disabled={disabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange?.(field.field_key, e.target.checked)
                  }
                />
                <span>{field.placeholder ?? "Yes"}</span>
              </label>
            ) : field.field_type === "switch" ? (
              <label className="flex items-center gap-3 text-sm">
                <input
                  id={field.field_key}
                  type="checkbox"
                  checked={Boolean(value)}
                  disabled={disabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange?.(field.field_key, e.target.checked)
                  }
                />
                <span className="text-muted-foreground">{Boolean(value) ? "Yes" : "No"}</span>
              </label>
            ) : (
              <Input
                id={field.field_key}
                type={
                  field.field_type === "email"
                    ? "email"
                    : field.field_type === "phone"
                      ? "tel"
                      : field.field_type === "number"
                        ? "number"
                        : field.field_type === "date"
                          ? "date"
                          : "text"
                }
                value={String(value ?? "")}
                placeholder={field.placeholder ?? undefined}
                disabled={disabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange?.(
                    field.field_key,
                    field.field_type === "number" && e.target.value !== ""
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
