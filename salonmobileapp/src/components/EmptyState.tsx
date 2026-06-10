import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme/colors";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 17, fontWeight: "600", color: colors.primaryForeground, textAlign: "center" },
  description: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
