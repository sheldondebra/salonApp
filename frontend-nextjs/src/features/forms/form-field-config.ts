import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  Hash,
  Heading,
  List,
  ListChecks,
  Mail,
  Phone,
  TextCursorInput,
  ToggleLeft,
  Type,
} from "lucide-react";
import type { FormFieldDefinition, FormFieldType } from "@/lib/api/types";

export const FORM_FIELD_TYPES: { type: FormFieldType; label: string; icon: LucideIcon }[] = [
  { type: "heading", label: "Section heading", icon: Heading },
  { type: "text", label: "Short text", icon: Type },
  { type: "textarea", label: "Long text", icon: AlignLeft },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Phone", icon: Phone },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "select", label: "Dropdown", icon: List },
  { type: "multiselect", label: "Multi select", icon: ListChecks },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "switch", label: "Yes / No", icon: ToggleLeft },
];

export function formFieldIcon(type: string): LucideIcon {
  return FORM_FIELD_TYPES.find((f) => f.type === type)?.icon ?? TextCursorInput;
}

export function formFieldLabel(type: string): string {
  return FORM_FIELD_TYPES.find((f) => f.type === type)?.label ?? "Field";
}

export function defaultFieldForType(type: FormFieldType, sortOrder: number): FormFieldDefinition {
  const base = {
    field_type: type,
    label: formFieldLabel(type),
    field_key: "",
    sort_order: sortOrder,
    is_required: false,
  };

  if (type === "heading") {
    return { ...base, field_key: `heading_${sortOrder}`, label: "Section title" };
  }

  if (type === "select" || type === "multiselect") {
    return { ...base, options: { choices: ["Option 1", "Option 2"] } };
  }

  return base;
}
