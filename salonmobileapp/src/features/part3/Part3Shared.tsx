import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Card } from "@/components/Card";
import { colors, radii, spacing } from "@/theme/colors";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<StatusTone, { backgroundColor: string; color: string; borderColor: string }> = {
  neutral: { backgroundColor: colors.muted, color: colors.primaryForeground, borderColor: colors.border },
  success: { backgroundColor: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" },
  warning: { backgroundColor: "#FEF3C7", color: "#92400E", borderColor: "#FCD34D" },
  danger: { backgroundColor: "#FEE2E2", color: colors.destructive, borderColor: "#FCA5A5" },
  info: { backgroundColor: "#DBEAFE", color: "#1D4ED8", borderColor: "#93C5FD" },
};

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  const palette = toneStyles[tone];
  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text style={[styles.statusText, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

export function DetailCard({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card style={[styles.detailCard, style]}>
      <Text style={styles.detailTitle}>{title}</Text>
      {subtitle ? <Text style={styles.detailSubtitle}>{subtitle}</Text> : null}
      {children}
    </Card>
  );
}

export function TagList({ values }: { values: string[] }) {
  if (!values.length) {
    return <Text style={styles.muted}>No tags yet.</Text>;
  }

  return (
    <View style={styles.tagList}>
      {values.map((value) => (
        <View key={value} style={styles.tag}>
          <Text style={styles.tagText}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export const part3Styles = StyleSheet.create({
  listCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  listCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  cardMeta: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  stack: { gap: spacing.sm },
  twoColumn: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  muted: { fontSize: 13, color: colors.mutedForeground, lineHeight: 19 },
});

const styles = StyleSheet.create({
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailCard: { gap: spacing.sm },
  detailTitle: { fontSize: 20, fontWeight: "800", color: colors.primaryForeground },
  detailSubtitle: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  muted: { fontSize: 13, color: colors.mutedForeground, lineHeight: 19 },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagText: { fontSize: 12, fontWeight: "600", color: colors.primaryForeground },
});
