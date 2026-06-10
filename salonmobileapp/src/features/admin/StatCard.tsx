import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/theme/colors";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  style?: ViewStyle;
};

export function StatCard({ label, value, hint, style }: StatCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primaryForeground,
    marginTop: spacing.xs,
  },
  hint: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
});

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={gridStyles.grid}>{children}</View>;
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
