import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.black,
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.accent,
    fontWeight: "600",
  },
});
