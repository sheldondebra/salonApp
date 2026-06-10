import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { formatStatusLabel } from "@/booking/format";
import type { StaffMember } from "@/staff/types";
import { colors, radii, spacing } from "@/theme/colors";

type StaffProfilePanelProps = {
  staff: StaffMember;
  canEdit?: boolean;
  canDeactivate?: boolean;
  onEdit?: () => void;
  onServices?: () => void;
  onHours?: () => void;
  onDeactivate?: () => void;
};

export function StaffProfilePanel({
  staff,
  canEdit,
  canDeactivate,
  onEdit,
  onServices,
  onHours,
  onDeactivate,
}: StaffProfilePanelProps) {
  const email = staff.user?.email;
  const phone = staff.user?.phone;

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: staff.color_code ?? colors.accent }]}>
          <Text style={styles.initials}>{staff.initials ?? staff.display_name.slice(0, 2)}</Text>
        </View>
        <Text style={styles.name}>{staff.display_name}</Text>
        <Text style={styles.title}>{staff.job_title ?? staff.title ?? "Staff member"}</Text>
        <View style={styles.badges}>
          <Badge
            label={formatStatusLabel(staff.employment_status ?? "active")}
            tint={staff.employment_status === "on_leave" ? "#D97706" : colors.success}
          />
          {staff.is_bookable ? <Badge label="Bookable" tint={colors.accent} /> : null}
          {!staff.is_active ? <Badge label="Inactive" tint={colors.mutedForeground} /> : null}
        </View>
      </View>

      {staff.bio ? <Text style={styles.bio}>{staff.bio}</Text> : null}

      <View style={styles.section}>
        <Detail icon="mail-outline" label="Email" value={email ?? "—"} />
        <Detail icon="call-outline" label="Phone" value={phone ?? "—"} />
        <Detail icon="location-outline" label="Branch" value={staff.location?.name ?? "—"} />
        <Detail
          icon="briefcase-outline"
          label="Employment"
          value={staff.employment_type?.replace(/_/g, " ") ?? "—"}
        />
        <Detail icon="calendar-outline" label="Hire date" value={staff.hire_date ?? "—"} />
        <Detail
          icon="clipboard-outline"
          label="Appointments"
          value={String(staff.appointments_count ?? 0)}
          last
        />
      </View>

      <View style={styles.actions}>
        {email ? (
          <ActionButton icon="mail-outline" label="Email" onPress={() => void Linking.openURL(`mailto:${email}`)} />
        ) : null}
        {phone ? (
          <ActionButton icon="call-outline" label="Call" onPress={() => void Linking.openURL(`tel:${phone}`)} />
        ) : null}
        {onServices ? (
          <ActionButton icon="cut-outline" label="Services" onPress={onServices} />
        ) : null}
        {onHours ? (
          <ActionButton icon="time-outline" label="Hours" onPress={onHours} />
        ) : null}
        {canEdit && onEdit ? (
          <ActionButton icon="create-outline" label="Edit" onPress={onEdit} primary />
        ) : null}
        {canDeactivate && onDeactivate ? (
          <Button label="Deactivate staff" variant="destructive" onPress={onDeactivate} />
        ) : null}
      </View>
    </View>
  );
}

function Detail({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function Badge({ label, tint }: { label: string; tint: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${tint}22` }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{label}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionBtn, primary && styles.actionBtnPrimary]}
    >
      <Ionicons name={icon} size={20} color={primary ? colors.primaryForeground : colors.accent} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  hero: { alignItems: "center", paddingVertical: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  initials: { fontSize: 24, fontWeight: "800", color: colors.white },
  name: { fontSize: 22, fontWeight: "800", color: colors.black },
  title: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md, justifyContent: "center" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  detailRow: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailBody: { flex: 1, gap: 2 },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  detailValue: { fontSize: 15, fontWeight: "600", color: colors.black, textTransform: "capitalize" },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  actionText: { fontSize: 15, fontWeight: "700", color: colors.black },
  actionTextPrimary: { color: colors.primaryForeground },
});
