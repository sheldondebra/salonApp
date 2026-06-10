import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { fieldIsVisible } from "@/features/forms/form-conditional";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { fetchFormTemplate, submitForm, type FormFieldDefinition, type FormTemplate } from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

type FormFillScreenProps = {
  formUuid: string;
};

export function FormFillScreen({ formUuid }: FormFillScreenProps) {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const { useSplitLayout } = useResponsiveLayout();
  const auth = useMemo(
    () => (token && tenantSlug ? { token, tenantSlug } : null),
    [token, tenantSlug]
  );

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const data = await fetchFormTemplate(auth, formUuid);
      setTemplate(data);
      setStep(0);
      setAnswers({});
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not load form");
    } finally {
      setLoading(false);
    }
  }, [auth, formUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleFields = useMemo(() => {
    if (!template) return [];
    return [...template.fields]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .filter((f) => f.field_type !== "heading" && fieldIsVisible(f, answers));
  }, [template, answers]);

  const currentField = visibleFields[step] ?? null;
  const progress = visibleFields.length ? `${step + 1} / ${visibleFields.length}` : "";

  const setAnswer = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!auth || !template) return;
    setSubmitting(true);
    try {
      await submitForm(auth, formUuid, answers);
      Alert.alert("Submitted", "Form saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!currentField) return;
    if (currentField.is_required) {
      const v = answers[currentField.field_key];
      const empty =
        v === null ||
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);
      if (empty) {
        Alert.alert("Required", `${currentField.label} is required.`);
        return;
      }
    }
    if (step >= visibleFields.length - 1) {
      void submit();
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step <= 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  if (loading || !template) {
    return (
      <ResponsiveShell>
        <LoadingState message="Loading form…" />
      </ResponsiveShell>
    );
  }

  const previewPanel = (
    <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
      <Text style={styles.previewTitle}>All fields</Text>
      {template.fields
        .filter((f) => fieldIsVisible(f, answers))
        .map((f) => (
          <Text key={f.field_key} style={styles.previewRow}>
            {f.field_type === "heading" ? `— ${f.label}` : `• ${f.label}`}
          </Text>
        ))}
    </ScrollView>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader title={template.name} subtitle={progress || template.category} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={useSplitLayout ? styles.split : undefined}
      >
        {useSplitLayout ? previewPanel : null}
        <ScrollView contentContainerStyle={styles.fillContent} keyboardShouldPersistTaps="handled">
          {currentField ? (
            <FieldStep field={currentField} value={answers[currentField.field_key]} onChange={setAnswer} />
          ) : (
            <Text style={styles.meta}>No fillable fields in this form.</Text>
          )}
          <View style={styles.actions}>
            <Button label={step <= 0 ? "Cancel" : "Back"} variant="secondary" onPress={back} />
            <Button
              label={step >= visibleFields.length - 1 ? (submitting ? "Submitting…" : "Submit") : "Next"}
              onPress={next}
              disabled={submitting || !currentField}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ResponsiveShell>
  );
}

function FieldStep({
  field,
  value,
  onChange,
}: {
  field: FormFieldDefinition;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  const key = field.field_key;

  if (field.field_type === "switch" || field.field_type === "checkbox") {
    return (
      <View style={styles.step}>
        <Text style={styles.label}>{field.label}</Text>
        {field.help_text ? <Text style={styles.help}>{field.help_text}</Text> : null}
        <View style={styles.switchRow}>
          <Switch value={Boolean(value)} onValueChange={(v) => onChange(key, v)} />
          <Text style={styles.meta}>{Boolean(value) ? "Yes" : "No"}</Text>
        </View>
      </View>
    );
  }

  if (field.field_type === "select" || field.field_type === "multiselect") {
    const choices = field.options?.choices ?? [];
    return (
      <View style={styles.step}>
        <Text style={styles.label}>{field.label}</Text>
        {choices.map((choice) => {
          const selected =
            field.field_type === "multiselect"
              ? Array.isArray(value) && value.includes(choice)
              : value === choice;
          return (
            <Pressable
              key={choice}
              style={[styles.choice, selected && styles.choiceSelected]}
              onPress={() => {
                if (field.field_type === "multiselect") {
                  const current = Array.isArray(value) ? [...value] : [];
                  onChange(
                    key,
                    selected ? current.filter((c) => c !== choice) : [...current, choice]
                  );
                } else {
                  onChange(key, choice);
                }
              }}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const multiline = field.field_type === "textarea";

  return (
    <View style={styles.step}>
      <Text style={styles.label}>{field.label}</Text>
      {field.help_text ? <Text style={styles.help}>{field.help_text}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={String(value ?? "")}
        placeholder={field.placeholder ?? undefined}
        multiline={multiline}
        keyboardType={
          field.field_type === "email"
            ? "email-address"
            : field.field_type === "phone"
              ? "phone-pad"
              : field.field_type === "number"
                ? "numeric"
                : "default"
        }
        onChangeText={(text) => onChange(key, text)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: "row", gap: spacing.lg },
  previewScroll: { flex: 1, maxWidth: 280 },
  previewContent: { padding: spacing.md, gap: spacing.xs },
  previewTitle: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground, marginBottom: spacing.sm },
  previewRow: { fontSize: 14, color: colors.primaryForeground },
  fillContent: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  step: { gap: spacing.sm },
  label: { fontSize: 20, fontWeight: "700", color: colors.primaryForeground },
  help: { fontSize: 14, color: colors.mutedForeground },
  meta: { fontSize: 14, color: colors.mutedForeground },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.primaryForeground,
    backgroundColor: colors.surface,
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  choiceSelected: { borderColor: colors.accent, backgroundColor: `${colors.accent}22` },
  choiceText: { fontSize: 16, color: colors.primaryForeground },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
});
