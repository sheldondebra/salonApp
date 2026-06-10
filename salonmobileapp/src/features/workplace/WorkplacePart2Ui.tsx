import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { colors, radii, spacing } from "@/theme/colors";

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function StepFlowCard({
  title,
  description,
  steps,
  children,
}: {
  title: string;
  description?: string;
  steps: string[];
  children?: React.ReactNode;
}) {
  return (
    <Card style={styles.flowCard}>
      <Text style={styles.flowTitle}>{title}</Text>
      {description ? <Text style={styles.flowDescription}>{description}</Text> : null}
      <View style={styles.stepList}>
        {steps.map((step, index) => (
          <View key={`${title}-${index}`} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
      {children}
    </Card>
  );
}

export function MetricBar({
  label,
  value,
  subtitle,
  tint = colors.primary,
}: {
  label: string;
  value: number;
  subtitle?: string;
  tint?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <Card>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{formatPercent(safeValue)}</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${safeValue}%`, backgroundColor: tint }]} />
      </View>
      {subtitle ? <Text style={styles.metricSubtitle}>{subtitle}</Text> : null}
    </Card>
  );
}

export function formatDateLabel(value?: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

export const sharedStyles = StyleSheet.create({
  split: { flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  listPane: { flex: 1, minWidth: 280, gap: spacing.sm },
  detailPane: { flex: 1, minWidth: 300, gap: spacing.md },
  sectionBlock: { gap: spacing.sm },
  muted: { fontSize: 13, color: colors.mutedForeground, lineHeight: 19 },
  strong: { fontSize: 15, fontWeight: "600", color: colors.primaryForeground },
  error: { fontSize: 13, color: colors.destructive },
  emptyPad: { paddingVertical: spacing.xl },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});

const styles = StyleSheet.create({
  sectionHeading: { gap: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  sectionSubtitle: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  chipTextSelected: { color: colors.primaryForeground },
  flowCard: { gap: spacing.md },
  flowTitle: { fontSize: 18, fontWeight: "700", color: colors.primaryForeground },
  flowDescription: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  stepList: { gap: spacing.sm },
  stepRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: { fontSize: 12, fontWeight: "700", color: colors.primaryForeground },
  stepText: { flex: 1, fontSize: 14, color: colors.primaryForeground, lineHeight: 20 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  metricLabel: { fontSize: 15, fontWeight: "600", color: colors.primaryForeground },
  metricValue: { fontSize: 15, fontWeight: "700", color: colors.primaryDark },
  metricTrack: {
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  metricFill: { height: "100%", borderRadius: radii.full },
  metricSubtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: spacing.sm },
});
