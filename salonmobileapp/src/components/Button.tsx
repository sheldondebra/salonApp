import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radii, touchTargetMinPx, typography } from "@/theme/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.primaryForeground : colors.primaryDark} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" && styles.primaryLabel,
            variant === "secondary" && styles.secondaryLabel,
            variant === "ghost" && styles.ghostLabel,
            variant === "destructive" && styles.destructiveLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargetMinPx,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 16,
    fontFamily: typography.fontFamily.sansSemiBold,
    fontWeight: "600",
  },
  primaryLabel: { color: colors.primaryForeground },
  secondaryLabel: { color: colors.primaryForeground },
  ghostLabel: { color: colors.primaryDark },
  destructiveLabel: { color: colors.destructive },
});
