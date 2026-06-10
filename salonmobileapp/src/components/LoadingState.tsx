import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme/colors";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primaryDark} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: { fontSize: 14, color: colors.mutedForeground },
});
