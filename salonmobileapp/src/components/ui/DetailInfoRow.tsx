import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/theme/colors";

type DetailInfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
  iconTint?: string;
  last?: boolean;
};

export function DetailInfoRow({
  icon,
  label,
  value,
  hint,
  iconTint = colors.accent,
  last,
}: DetailInfoRowProps) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconTint}18` }]}>
        <Ionicons name={icon} size={20} color={iconTint} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: colors.mutedForeground,
  },
  value: { fontSize: 16, fontWeight: "600", color: colors.black, lineHeight: 22 },
  hint: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
});
