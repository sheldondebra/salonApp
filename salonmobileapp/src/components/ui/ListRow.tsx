import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/theme/colors";

type ListRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconTint?: string;
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
};

export function ListRow({ icon, iconTint = colors.accent, title, subtitle, right, onPress }: ListRowProps) {
  const inner = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${iconTint}18` }]}>
          <Ionicons name={icon} size={20} color={iconTint} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <Text style={styles.right}>{right}</Text> : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.row}>{inner}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.92 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600", color: colors.black },
  subtitle: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  right: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    color: colors.primaryForeground,
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
});
