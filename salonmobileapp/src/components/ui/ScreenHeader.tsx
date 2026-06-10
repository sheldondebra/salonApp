import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/colors";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onSignOut?: () => void;
};

export function ScreenHeader({ title, subtitle, onRefresh, onSignOut }: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        {onRefresh ? (
          <Pressable onPress={onRefresh} style={styles.iconBtn} accessibilityLabel="Refresh">
            <Ionicons name="refresh-outline" size={22} color={colors.primaryForeground} />
          </Pressable>
        ) : null}
        {onSignOut ? (
          <Pressable onPress={onSignOut} style={styles.iconBtn} accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={22} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  textCol: { flex: 1, gap: 4 },
  title: { fontSize: 26, fontWeight: "800", color: colors.black, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  actions: { flexDirection: "row", gap: spacing.xs },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
