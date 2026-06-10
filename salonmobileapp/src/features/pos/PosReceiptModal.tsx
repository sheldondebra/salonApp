import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { formatMoney } from "@/booking/format";
import type { Sale } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

type PosReceiptModalProps = {
  visible: boolean;
  sale: Sale | null;
  currency: string;
  onClose: () => void;
  onNewSale: () => void;
  onRequestMomo?: () => void;
  showRequestMomo?: boolean;
};

export function PosReceiptModal({
  visible,
  sale,
  currency,
  onClose,
  onNewSale,
  onRequestMomo,
  showRequestMomo,
}: PosReceiptModalProps) {
  if (!sale) return null;

  const cur = sale.currency ?? currency;
  const when = sale.completed_at
    ? new Date(sale.completed_at).toLocaleString()
    : new Date(sale.created_at).toLocaleString();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.successTitle}>Sale complete</Text>
          <Text style={styles.successSub}>{sale.sale_number ?? sale.uuid.slice(0, 8)}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.metaCard}>
            <MetaRow icon="time-outline" label="When" value={when} />
            <MetaRow icon="person-outline" label="Customer" value={sale.client?.name ?? "Walk-in"} />
            <MetaRow icon="location-outline" label="Branch" value={sale.location?.name ?? "—"} />
            <MetaRow
              icon="card-outline"
              label="Payment"
              value={sale.payment_method.replace(/_/g, " ")}
              last
            />
          </View>

          <Text style={styles.itemsTitle}>Items</Text>
          {(sale.items ?? []).map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>{formatMoney(item.line_total_cents, cur)}</Text>
            </View>
          ))}

          <View style={styles.totals}>
            <Line label="Subtotal" value={formatMoney(sale.subtotal_cents, cur)} />
            {sale.discount_cents > 0 ? (
              <Line label="Discount" value={`-${formatMoney(sale.discount_cents, cur)}`} green />
            ) : null}
            {sale.tax_cents > 0 ? <Line label="Tax" value={formatMoney(sale.tax_cents, cur)} /> : null}
            {sale.service_charge_cents > 0 ? (
              <Line label="Service charge" value={formatMoney(sale.service_charge_cents, cur)} />
            ) : null}
            {sale.tip_cents > 0 ? <Line label="Tip" value={formatMoney(sale.tip_cents, cur)} /> : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total paid</Text>
              <Text style={styles.totalValue}>{formatMoney(sale.total_cents, cur)}</Text>
            </View>
          </View>

          {sale.notes ? (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Note</Text>
              <Text style={styles.notesText}>{sale.notes}</Text>
            </View>
          ) : null}

          <Button label="New sale" onPress={onNewSale} />
          {showRequestMomo && onRequestMomo ? (
            <Button label="Request MoMo payment" variant="secondary" onPress={onRequestMomo} />
          ) : null}
          <Button label="Close receipt" variant="secondary" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function MetaRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.metaRow, !last && styles.metaBorder]}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <View style={styles.metaBody}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

function Line({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineValue, green && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  successBanner: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    backgroundColor: `${colors.success}14`,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: colors.black, marginTop: spacing.sm },
  successSub: { fontSize: 15, color: colors.mutedForeground, marginTop: 4 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.md },
  metaBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  metaBody: { flex: 1, gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase" },
  metaValue: { fontSize: 15, fontWeight: "600", color: colors.black, textTransform: "capitalize" },
  itemsTitle: { fontSize: 15, fontWeight: "700", color: colors.black },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: { flex: 1, fontSize: 14, color: colors.black, marginRight: spacing.sm },
  itemPrice: { fontSize: 14, fontWeight: "600", color: colors.black },
  totals: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineLabel: { fontSize: 14, color: colors.mutedForeground },
  lineValue: { fontSize: 14, fontWeight: "600", color: colors.black },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: { fontSize: 17, fontWeight: "700", color: colors.black },
  totalValue: { fontSize: 20, fontWeight: "800", color: colors.accent },
  notes: {
    backgroundColor: colors.muted,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  notesLabel: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.black },
});
