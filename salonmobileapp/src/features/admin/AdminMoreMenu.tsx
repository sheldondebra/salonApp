import { StyleSheet, Text, View } from "react-native";
import { canManageBilling, canViewTenants } from "@/admin/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { env } from "@/config/env";
import { colors, spacing } from "@/theme/colors";

export function AdminMoreMenu() {
  const { user, me, logout } = useAuth();

  return (
    <ResponsiveShell>
      <Header title="More" subtitle="Platform tools & account" />

      <Card>
        <Text style={styles.label}>Signed in</Text>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
      </Card>

      <Card>
        <Text style={styles.label}>API</Text>
        <Text style={styles.meta}>{env.apiUrl}</Text>
      </Card>

      <Card style={styles.gap}>
        <Text style={styles.section}>Platform (web)</Text>
        <Text style={styles.hint}>
          Billing, SMS reseller, coupons, and domain management are available in the Schedelux web admin.
        </Text>
        {canViewTenants(me) ? (
          <Text style={styles.bullet}>• Salon workspaces — use Salons tab</Text>
        ) : null}
        {canManageBilling(me) ? (
          <Text style={styles.bullet}>• Billing & SMS — open web admin</Text>
        ) : (
          <Text style={styles.bullet}>• Billing requires billing.manage permission</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <Button label="Sign out" variant="destructive" onPress={() => void logout()} />
      </View>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
  },
  name: { fontSize: 18, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
  meta: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  gap: { gap: spacing.sm },
  section: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground },
  hint: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  bullet: { fontSize: 14, color: colors.mutedForeground },
  actions: { marginTop: spacing.md },
});
