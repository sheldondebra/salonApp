import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { SectionTitle } from "@/features/workplace/WorkplacePart2Ui";
import { colors, spacing } from "@/theme/colors";

export function WorkplaceMoreMenu() {
  const router = useRouter();
  const { user, tenantSlug, logout } = useAuth();

  return (
    <ResponsiveShell>
      <Header title="More" subtitle="Salon workspace" />

      <Card>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Salon · {tenantSlug ?? "—"}</Text>
      </Card>

      <Card>
        <SectionTitle title="Finance" subtitle="Money, payroll, tax, and business insights" />
        <View style={styles.toolGroup}>
          <Button
            label="Finance hub"
            variant="secondary"
            onPress={() => router.push("/workplace/finance" as never)}
          />
          <Button
            label="Smart insights"
            variant="secondary"
            onPress={() => router.push("/workplace/finance/insights" as never)}
          />
          <Button
            label="Profit & loss"
            variant="secondary"
            onPress={() => router.push("/workplace/finance/profit-loss" as never)}
          />
          <Button
            label="Prepaid balances"
            variant="secondary"
            onPress={() => router.push("/workplace/finance/prepaid-balances" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Core tools" subtitle="Daily operations already available on mobile" />
        <View style={styles.toolGroup}>
          <Button
            label="Forms"
            variant="secondary"
            onPress={() => router.push("/workplace/forms" as never)}
          />
          <Button
            label="Waitlist"
            variant="secondary"
            onPress={() => router.push("/workplace/waitlist" as never)}
          />
          <Button
            label="Schedelux Wallet"
            variant="secondary"
            onPress={() => router.push("/workplace/wallet" as never)}
          />
          <Button
            label="Payment settings"
            variant="secondary"
            onPress={() => router.push("/workplace/payment-settings" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Retail" subtitle="Memberships, package balances, gift cards, stock intake, and bundles" />
        <View style={styles.toolGroup}>
          <Button
            label="Memberships"
            variant="secondary"
            onPress={() => router.push("/workplace/memberships" as never)}
          />
          <Button
            label="Packages"
            variant="secondary"
            onPress={() => router.push("/workplace/packages" as never)}
          />
          <Button
            label="Gift cards"
            variant="secondary"
            onPress={() => router.push("/workplace/gift-cards" as never)}
          />
          <Button
            label="Purchase orders"
            variant="secondary"
            onPress={() => router.push("/workplace/purchase-orders" as never)}
          />
          <Button
            label="Bundles"
            variant="secondary"
            onPress={() => router.push("/workplace/bundles" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Reviews" subtitle="Review invites, feedback visibility, and complaint follow-up" />
        <View style={styles.toolGroup}>
          <Button
            label="Reviews"
            variant="secondary"
            onPress={() => router.push("/workplace/reviews" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Analytics" subtitle="Targets, occupancy, and client retention insights" />
        <View style={styles.toolGroup}>
          <Button
            label="KPI targets"
            variant="secondary"
            onPress={() => router.push("/workplace/kpi" as never)}
          />
          <Button
            label="Occupancy"
            variant="secondary"
            onPress={() => router.push("/workplace/analytics/occupancy" as never)}
          />
          <Button
            label="Retention"
            variant="secondary"
            onPress={() => router.push("/workplace/analytics/retention" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle
          title="Marketing"
          subtitle="Tracking, abandoned-booking recovery, rebooking prompts, and social booking links"
        />
        <View style={styles.toolGroup}>
          <Button
            label="Marketing integrations"
            variant="secondary"
            onPress={() => router.push("/workplace/marketing-integrations" as never)}
          />
          <Button
            label="Abandoned bookings"
            variant="secondary"
            onPress={() => router.push("/workplace/abandoned-bookings" as never)}
          />
          <Button
            label="Rebooking prompts"
            variant="secondary"
            onPress={() => router.push("/workplace/rebooking" as never)}
          />
          <Button
            label="Social booking links"
            variant="secondary"
            onPress={() => router.push("/workplace/social-links" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle
          title="Marketplace"
          subtitle="Business profile, location search insights, and listing performance"
        />
        <View style={styles.toolGroup}>
          <Button
            label="Marketplace"
            variant="secondary"
            onPress={() => router.push("/workplace/marketplace" as never)}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle
          title="Enterprise"
          subtitle="Multi-location comparison, chair rentals, approvals, and white-label preview"
        />
        <View style={styles.toolGroup}>
          <Button
            label="Branch comparison"
            variant="secondary"
            onPress={() => router.push("/workplace/branch-comparison" as never)}
          />
          <Button
            label="Chair rentals"
            variant="secondary"
            onPress={() => router.push("/workplace/chair-rentals" as never)}
          />
          <Button
            label="Approvals"
            variant="secondary"
            onPress={() => router.push("/workplace/approvals" as never)}
          />
          <Button
            label="White-label preview"
            variant="secondary"
            onPress={() => router.push("/workplace/white-label" as never)}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.hint}>
          Staff schedules, approval-policy editing, campaign automation builders, and full white-label
          publishing still live in the Schedelux web app for your salon.
        </Text>
      </Card>

      <Button label="Sign out" variant="destructive" onPress={() => void logout()} />
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
  toolGroup: { gap: spacing.sm, marginTop: spacing.sm },
  hint: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
});
