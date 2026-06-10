"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Eye,
  GripVertical,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { FORM_FIELD_TYPES, defaultFieldForType, formFieldIcon } from "@/features/forms/form-field-config";
import { FormRenderer } from "@/features/forms/form-renderer";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { FormFieldDefinition, FormFieldType, FormTemplate } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const textareaClass =
  "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

type FormBuilderViewProps = {
  tenantSlug: string;
  formUuid: string;
};

function slugKey(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return base || `field_${index}`;
}

export function FormBuilderView({ tenantSlug, formUuid }: FormBuilderViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canUpdate = can(Permissions.forms.update);
  const canDelete = can(Permissions.forms.delete);
  const canSubmit = can(Permissions.forms.create);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FormFieldDefinition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, unknown>>({});

  const selectedField = selectedIndex != null ? fields[selectedIndex] : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: FormTemplate }>(
        `/${tenantSlug}/forms/${formUuid}`
      );
      const t = res.data;
      setName(t.name);
      setCategory(t.category);
      setDescription(t.description ?? "");
      setIsActive(t.is_active);
      setFields(t.fields ?? []);
      setSelectedIndex(t.fields?.length ? 0 : null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not load form");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, formUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = (index: number, patch: Partial<FormFieldDefinition>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const addField = (type: FormFieldType) => {
    const next = defaultFieldForType(type, fields.length);
    next.field_key = slugKey(next.label, fields.length);
    setFields((prev) => [...prev, next]);
    setSelectedIndex(fields.length);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy.map((f, i) => ({ ...f, sort_order: i }));
    });
    setSelectedIndex(target);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i })));
    setSelectedIndex((prev) => {
      if (prev == null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
  };

  const save = async () => {
    if (!canUpdate) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        is_active: isActive,
        fields: fields.map((f, i) => ({
          ...f,
          sort_order: i,
          field_key: f.field_key || slugKey(f.label, i),
        })),
      };
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/forms/${formUuid}`, payload);
      toast.success("Form saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const submitPreview = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/forms/${formUuid}/submissions`, {
        answers: previewAnswers,
      });
      toast.success("Preview submission saved");
      setPreviewAnswers({});
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteForm = async () => {
    try {
      await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/forms/${formUuid}`);
      toast.success("Form deleted");
      window.location.href = `/${tenantSlug}/forms`;
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  const conditionalSources = useMemo(
    () =>
      fields.filter(
        (f, i) =>
          selectedIndex != null &&
          i < selectedIndex &&
          f.field_type !== "heading" &&
          f.field_key
      ),
    [fields, selectedIndex]
  );

  if (loading) {
    return <Skeleton className="h-[480px] w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${tenantSlug}/forms`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Forms
            </Link>
          </Button>
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Draft"}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate ? (
            <Button size="sm" disabled={saving} onClick={() => void save()}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          ) : null}
          {canDelete ? (
            <ConfirmAction
              label="Delete"
              title="Delete this form?"
              confirmMessage="Submissions will also be removed."
              confirmLabel="Delete"
              variant="destructive"
              icon={Trash2}
              onConfirm={() => void deleteForm()}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="form-name">Name</Label>
                <Input
                  id="form-name"
                  value={name}
                  disabled={!canUpdate}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-category">Category</Label>
                <Input
                  id="form-category"
                  value={category}
                  disabled={!canUpdate}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-desc">Description</Label>
                <textarea
                  id="form-desc"
                  className={textareaClass}
                  value={description}
                  disabled={!canUpdate}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="form-active">Active</Label>
                <input
                  id="form-active"
                  type="checkbox"
                  checked={isActive}
                  disabled={!canUpdate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fields</CardTitle>
              <CardDescription>Add and reorder questions. Select a field to edit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {canUpdate ? (
                <div className="flex flex-wrap gap-2">
                  {FORM_FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                    <Button key={type} size="sm" variant="outline" onClick={() => addField(type)}>
                      <Icon className="mr-1 h-3.5 w-3.5" />
                      {label}
                    </Button>
                  ))}
                </div>
              ) : null}

              <div className="space-y-1">
                {fields.map((field, index) => {
                  const Icon = formFieldIcon(field.field_type);
                  return (
                    <button
                      key={`${field.field_key}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        selectedIndex === index
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{field.label}</span>
                      {field.is_required ? (
                        <span className="text-xs text-destructive">Required</span>
                      ) : null}
                      {canUpdate ? (
                        <span className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveField(index, -1);
                            }}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveField(index, 1);
                            }}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {selectedField && canUpdate ? (
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Edit field</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={selectedField.label}
                        onChange={(e) =>
                          selectedIndex != null && updateField(selectedIndex, { label: e.target.value })
                        }
                      />
                    </div>
                    {selectedField.field_type !== "heading" ? (
                      <>
                        <div className="space-y-2">
                          <Label>Field key</Label>
                          <Input
                            value={selectedField.field_key}
                            onChange={(e) =>
                              selectedIndex != null &&
                              updateField(selectedIndex, { field_key: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Required</Label>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedField.is_required)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              selectedIndex != null &&
                              updateField(selectedIndex, { is_required: e.target.checked })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Help text</Label>
                          <Input
                            value={selectedField.help_text ?? ""}
                            onChange={(e) =>
                              selectedIndex != null &&
                              updateField(selectedIndex, { help_text: e.target.value || null })
                            }
                          />
                        </div>
                        {(selectedField.field_type === "select" ||
                          selectedField.field_type === "multiselect") && (
                          <div className="space-y-2">
                            <Label>Choices (one per line)</Label>
                            <textarea
                              className={textareaClass}
                              value={(selectedField.options?.choices ?? []).join("\n")}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                selectedIndex != null &&
                                updateField(selectedIndex, {
                                  options: {
                                    choices: e.target.value
                                      .split("\n")
                                      .map((s: string) => s.trim())
                                      .filter(Boolean),
                                  },
                                })
                              }
                              rows={4}
                            />
                          </div>
                        )}
                        <div className="space-y-2 rounded-lg border border-border p-3">
                          <Label>Conditional visibility</Label>
                          <Select
                            value={selectedField.visible_when?.field_key ?? "__none__"}
                            onValueChange={(v) => {
                              if (selectedIndex == null) return;
                              if (v === "__none__") {
                                updateField(selectedIndex, { visible_when: null });
                                return;
                              }
                              updateField(selectedIndex, {
                                visible_when: {
                                  field_key: v,
                                  operator: "equals",
                                  value: true,
                                },
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Always visible" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Always visible</SelectItem>
                              {conditionalSources.map((f) => (
                                <SelectItem key={f.field_key} value={f.field_key}>
                                  When {f.label} is yes
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => selectedIndex != null && removeField(selectedIndex)}
                        >
                          Remove field
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => selectedIndex != null && removeField(selectedIndex)}
                      >
                        Remove heading
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-4 xl:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Live preview
            </CardTitle>
            <CardDescription>Test conditional logic and required fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRenderer
              fields={fields}
              answers={previewAnswers}
              showFieldIcons
              onChange={(key, value) =>
                setPreviewAnswers((prev) => ({ ...prev, [key]: value }))
              }
            />
            {canSubmit ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled={submitting}
                onClick={() => void submitPreview()}
              >
                Save test submission
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
