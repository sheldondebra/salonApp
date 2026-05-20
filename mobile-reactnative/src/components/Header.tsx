import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme/colors";

type HeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 24, fontWeight: "700", color: colors.primaryForeground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
});
