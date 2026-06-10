import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/theme/colors";

type IconStatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
  tint?: string;
  style?: object;
};

export function IconStatCard({ icon, label, value, hint, tint = colors.accent, style }: IconStatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.hint} numberOfLines={1}>{hint}</Text> : null}
    </View>
  );
}

export function IconStatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 150,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  value: { fontSize: 20, fontWeight: "800", color: colors.black },
  hint: { fontSize: 11, color: colors.mutedForeground },
});
