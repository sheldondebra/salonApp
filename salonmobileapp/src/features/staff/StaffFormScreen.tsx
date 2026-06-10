import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import {
  createStaffMember,
  updateStaffMember,
  type StaffAuth,
} from "@/staff/api";
import type { StaffFormBody, StaffLocation, StaffMember } from "@/staff/types";
import { colors, radii, spacing } from "@/theme/colors";

type StaffFormScreenProps = {
  auth: StaffAuth;
  locations: StaffLocation[];
  initial?: StaffMember;
};

export function StaffFormScreen({ auth, locations, initial }: StaffFormScreenProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    display_name: initial?.display_name ?? "",
    title: initial?.job_title ?? initial?.title ?? "",
    email: initial?.user?.email ?? "",
    phone: initial?.user?.phone ?? "",
    location_id: initial?.location_id ? String(initial.location_id) : "",
    bio: initial?.bio ?? "",
    is_bookable: initial?.is_bookable ?? true,
    is_active: initial?.is_active ?? true,
  });

  async function save() {
    if (!form.display_name.trim()) {
      setError("Display name is required");
      return;
    }
    setSaving(true);
    setError("");
    const body: StaffFormBody = {
      display_name: form.display_name.trim(),
      title: form.title || null,
      email: form.email || undefined,
      phone: form.phone || null,
      location_id: form.location_id ? Number(form.location_id) : null,
      bio: form.bio || null,
      is_bookable: form.is_bookable,
      is_active: form.is_active,
    };
    try {
      if (initial) {
        await updateStaffMember(auth, initial.id, body);
      } else {
        await createStaffMember(auth, body);
      }
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveShell reserveTabBar={false}>
      <ScreenHeader title={initial ? "Edit staff" : "Add staff"} subtitle={auth.tenantSlug} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <Field label="Display name *" value={form.display_name} onChangeText={(v) => setForm({ ...form, display_name: v })} />
        <Field label="Job title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <Field label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
        <Field label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Text style={styles.label}>Branch</Text>
        <View style={styles.chips}>
          <Chip label="None" active={!form.location_id} onPress={() => setForm({ ...form, location_id: "" })} />
          {locations.map((loc) => (
            <Chip
              key={loc.id}
              label={loc.name}
              active={form.location_id === String(loc.id)}
              onPress={() => setForm({ ...form, location_id: String(loc.id) })}
            />
          ))}
        </View>
        <Field label="Bio" value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline />
        <Toggle label="Bookable online" value={form.is_bookable} onToggle={() => setForm({ ...form, is_bookable: !form.is_bookable })} />
        <Toggle label="Active" value={form.is_active} onToggle={() => setForm({ ...form, is_active: !form.is_active })} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={saving ? "Saving…" : initial ? "Save changes" : "Create staff"} onPress={() => void save()} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </ResponsiveShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.toggle}>
      <Text style={styles.toggleText}>
        {value ? "☑" : "☐"} {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.black,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  chipText: { fontSize: 13, color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryForeground, fontWeight: "700" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  toggle: { marginBottom: spacing.sm },
  toggleText: { fontSize: 15, color: colors.black },
  error: { color: colors.destructive, marginBottom: spacing.md },
});
