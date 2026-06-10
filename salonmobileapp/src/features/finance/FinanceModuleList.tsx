import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FINANCE_MODULE_SECTIONS } from "@/features/finance/finance-modules";
import { colors, spacing } from "@/theme/colors";

export function FinanceModuleList() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {FINANCE_MODULE_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <SectionHeader title={section.title} />
          {section.subtitle ? <Text style={styles.subtitle}>{section.subtitle}</Text> : null}
          {section.modules.map((module) => (
            <ListRow
              key={module.id}
              icon={module.icon}
              iconTint={module.tint}
              title={module.label}
              subtitle={module.subtitle}
              onPress={() => router.push(module.route as never)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  section: { gap: spacing.xs },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginBottom: spacing.xs, marginTop: -spacing.xs },
});
