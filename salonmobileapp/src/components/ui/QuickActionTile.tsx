import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/theme/colors";

type QuickActionTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
};

export function QuickActionGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function QuickActionTile({ icon, label, onPress, tint = colors.accent }: QuickActionTileProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    width: "30%",
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryForeground,
    textAlign: "center",
  },
});
