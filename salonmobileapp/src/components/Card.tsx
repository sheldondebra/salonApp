import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radii, spacing } from "@/theme/colors";

type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ children, style, padded = true, ...props }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  padded: { padding: spacing.md },
});
