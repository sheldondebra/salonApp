import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fetchFinanceTaxReport, fetchTaxRates } from "@/finance/api";
import type { FinanceTaxReport, TenantTaxRate } from "@/finance/types";
import { colors, spacing } from "@/theme/colors";

const CURRENCY = "GHS";

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceTaxesScreen() {
  const auth = useTenantAuth();
  const [rates, setRates] = useState<TenantTaxRate[]>([]);
  const [report, setReport] = useState<FinanceTaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [rateRows, reportData] = await Promise.all([
        fetchTaxRates(auth),
        fetchFinanceTaxReport(auth, { from: defaultFromDate(), to: defaultToDate() }),
      ]);
      setRates(rateRows);
      setReport(reportData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load taxes");
      setRates([]);
      setReport(null);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !report) {
    return <LoadingState message="Loading taxes…" />;
  }

  const summary = report?.summary;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader title="Taxes & VAT" subtitle="Last 30 days · read-only on mobile" />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="calculator-outline"
            label="Tax collected"
            value={formatMoney(summary?.tax_collected_cents ?? 0, CURRENCY)}
            tint="#7C3AED"
          />
          <IconStatCard
            icon="receipt-outline"
            label="Taxable sales"
            value={formatMoney(summary?.taxable_sales_cents ?? 0, CURRENCY)}
          />
          <IconStatCard
            icon="storefront-outline"
            label="POS tax"
            value={formatMoney(summary?.pos_tax_cents ?? 0, CURRENCY)}
            hint={`${summary?.pos_sale_count ?? 0} sales`}
          />
          <IconStatCard
            icon="document-text-outline"
            label="Invoice tax"
            value={formatMoney(summary?.invoice_tax_cents ?? 0, CURRENCY)}
            hint={`${summary?.invoice_count ?? 0} invoices`}
          />
        </IconStatGrid>

        <SectionHeader title="Tax rates" />
        {rates.length === 0 ? (
          <EmptyState title="No rates" description="Configure tax rates on the web app." />
        ) : (
          rates.map((rate) => (
            <ListRow
              key={rate.id}
              icon="pricetag-outline"
              title={rate.name}
              subtitle={`${rate.rate}% · ${rate.applies_to} · ${rate.inclusive_or_exclusive}`}
              right={rate.is_default ? "Default" : rate.is_active ? "Active" : "Off"}
            />
          ))
        )}

        {(report?.monthly_trend ?? []).length > 0 ? (
          <>
            <SectionHeader title="By month" />
            {(report?.monthly_trend ?? []).map((point) => (
              <ListRow
                key={point.month}
                icon="calendar-outline"
                title={point.label}
                right={formatMoney(point.tax_cents, CURRENCY)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  error: { color: colors.destructive, fontSize: 14 },
});
