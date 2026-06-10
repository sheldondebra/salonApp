import type { FormFieldDefinition } from "@/workplace/api";

export function fieldIsVisible(field: FormFieldDefinition, answers: Record<string, unknown>): boolean {
  const rule = field.visible_when;
  if (!rule?.field_key) return true;

  const depValue = answers[rule.field_key];
  const operator = rule.operator ?? "equals";
  const expected = rule.value;

  if (operator === "filled") {
    return (
      depValue !== null &&
      depValue !== undefined &&
      depValue !== "" &&
      !(Array.isArray(depValue) && depValue.length === 0)
    );
  }

  if (operator === "not_equals") {
    return String(depValue ?? "") !== String(expected ?? "");
  }

  if (typeof expected === "boolean") {
    return Boolean(depValue) === expected;
  }

  return String(depValue ?? "") === String(expected ?? "");
}
