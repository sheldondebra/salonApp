import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { formatMoney } from "@/booking/format";
import type { CartLine, PaymentMethod } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "cash", label: "Cash", icon: "cash-outline" },
  { value: "card", label: "Card", icon: "card-outline" },
  { value: "mobile_money", label: "Mobile money", icon: "phone-portrait-outline" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
];

type PosCheckoutModalProps = {
  visible: boolean;
  currency: string;
  cart: CartLine[];
  subtotalCents: number;
  taxCents: number;
  serviceChargeCents: number;
  tipCents: number;
  couponDiscountCents: number;
  manualDiscountCents: number;
  totalCents: number;
  checkingOut: boolean;
  couponError: string;
  canApplyManualDiscount: boolean;
  discountThresholdPercent: number;
  discountPercent: number;
  requiresApproval: boolean;
  hasApproval: boolean;
  requestingApproval: boolean;
  manualDiscountInput: string;
  onManualDiscountInputChange: (value: string) => void;
  onRequestApproval: () => void;
  onClose: () => void;
  onComplete: (opts: {
    paymentMethod: PaymentMethod;
    taxPercent: string;
    serviceChargePercent: string;
    tipInput: string;
    notes: string;
    couponCode: string;
  }) => void;
  onValidateCoupon: (code: string) => Promise<void>;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
};

export function PosCheckoutModal({
  visible,
  currency,
  cart,
  subtotalCents,
  taxCents,
  serviceChargeCents,
  tipCents,
  couponDiscountCents,
  manualDiscountCents,
  totalCents,
  checkingOut,
  couponError,
  canApplyManualDiscount,
  discountThresholdPercent,
  discountPercent,
  requiresApproval,
  hasApproval,
  requestingApproval,
  manualDiscountInput,
  onManualDiscountInputChange,
  onRequestApproval,
  onClose,
  onComplete,
  onValidateCoupon,
  couponCode,
  onCouponCodeChange,
}: PosCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [taxPercent, setTaxPercent] = useState("0");
  const [serviceChargePercent, setServiceChargePercent] = useState("0");
  const [tipInput, setTipInput] = useState("");
  const [notes, setNotes] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const blockedByApproval = requiresApproval && !hasApproval;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      await onValidateCoupon(couponCode.trim());
    } finally {
      setValidatingCoupon(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Complete payment</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Ionicons name="close" size={28} color={colors.black} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.meta}>
            {cart.length} line{cart.length === 1 ? "" : "s"} · Subtotal {formatMoney(subtotalCents, currency)}
          </Text>

          <Text style={styles.sectionLabel}>Payment method</Text>
          <View style={styles.payGrid}>
            {PAYMENT_METHODS.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setPaymentMethod(m.value)}
                  style={[styles.payChip, active && styles.payChipActive]}
                >
                  <Ionicons
                    name={m.icon}
                    size={22}
                    color={active ? colors.accent : colors.mutedForeground}
                  />
                  <Text style={[styles.payLabel, active && styles.payLabelActive]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tax %</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={taxPercent}
                onChangeText={setTaxPercent}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Service charge %</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={serviceChargePercent}
                onChangeText={setServiceChargePercent}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tip ({currency})</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              value={tipInput}
              onChangeText={setTipInput}
            />
          </View>

          {canApplyManualDiscount ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Manual discount ({currency})</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={manualDiscountInput}
                onChangeText={onManualDiscountInputChange}
              />
              <Text style={styles.hint}>
                Manager approval at {discountThresholdPercent}%+ (current {discountPercent.toFixed(1)}%)
              </Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Coupon code</Text>
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.input, styles.couponInput]}
                placeholder="Enter code"
                placeholderTextColor={colors.mutedForeground}
                value={couponCode}
                onChangeText={onCouponCodeChange}
                autoCapitalize="characters"
              />
              <Button
                label={validatingCoupon ? "…" : "Apply"}
                variant="secondary"
                onPress={() => void applyCoupon()}
                disabled={validatingCoupon || !couponCode.trim()}
                style={styles.applyBtn}
              />
            </View>
            {couponError ? <Text style={styles.couponErr}>{couponError}</Text> : null}
            {couponDiscountCents > 0 ? (
              <Text style={styles.couponOk}>
                Coupon: -{formatMoney(couponDiscountCents, currency)}
              </Text>
            ) : null}
          </View>

          {requiresApproval ? (
            <View style={[styles.approvalBox, hasApproval ? styles.approvalOk : styles.approvalWarn]}>
              <Text style={styles.approvalText}>
                {hasApproval
                  ? "Manager approved this discount. You can complete checkout."
                  : `Discount of ${discountPercent.toFixed(1)}% exceeds the ${discountThresholdPercent}% limit.`}
              </Text>
              {!hasApproval ? (
                <Button
                  label={requestingApproval ? "Requesting…" : "Request manager approval"}
                  variant="secondary"
                  onPress={onRequestApproval}
                  disabled={requestingApproval || checkingOut}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Receipt note"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View style={styles.totals}>
            <TotalLine label="Subtotal" value={formatMoney(subtotalCents, currency)} />
            {taxCents > 0 ? <TotalLine label="Tax" value={formatMoney(taxCents, currency)} /> : null}
            {serviceChargeCents > 0 ? (
              <TotalLine label="Service charge" value={formatMoney(serviceChargeCents, currency)} />
            ) : null}
            {tipCents > 0 ? <TotalLine label="Tip" value={formatMoney(tipCents, currency)} /> : null}
            {couponDiscountCents > 0 ? (
              <TotalLine label="Coupon" value={`-${formatMoney(couponDiscountCents, currency)}`} accent />
            ) : null}
            {manualDiscountCents > 0 ? (
              <TotalLine label="Manual discount" value={`-${formatMoney(manualDiscountCents, currency)}`} accent />
            ) : null}
            <View style={styles.dueRow}>
              <Text style={styles.dueLabel}>Amount due</Text>
              <Text style={styles.dueValue}>{formatMoney(totalCents, currency)}</Text>
            </View>
          </View>

          <Button
            label={checkingOut ? "Processing…" : `Charge ${formatMoney(totalCents, currency)}`}
            onPress={() =>
              onComplete({
                paymentMethod,
                taxPercent,
                serviceChargePercent,
                tipInput,
                notes,
                couponCode,
              })
            }
            loading={checkingOut}
            disabled={checkingOut || blockedByApproval}
            style={styles.chargeBtn}
          />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function TotalLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.totalLine}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, accent && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.sm },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.black },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  meta: { fontSize: 14, color: colors.mutedForeground },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  payGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  payChip: {
    width: "48%",
    flexGrow: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  payChipActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}12` },
  payLabel: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  payLabelActive: { color: colors.black },
  row2: { flexDirection: "row", gap: spacing.md },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  hint: { fontSize: 12, color: colors.mutedForeground },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.black,
  },
  notesInput: { minHeight: 72, textAlignVertical: "top" },
  couponRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  couponInput: { flex: 1 },
  applyBtn: { minHeight: 48 },
  couponErr: { fontSize: 13, color: colors.destructive },
  couponOk: { fontSize: 13, color: colors.success, fontWeight: "600" },
  approvalBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  approvalWarn: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  approvalOk: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
  approvalText: { fontSize: 14, color: colors.black },
  totals: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, color: colors.mutedForeground },
  totalValue: { fontSize: 14, fontWeight: "600", color: colors.black },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  dueLabel: { fontSize: 17, fontWeight: "700", color: colors.black },
  dueValue: { fontSize: 20, fontWeight: "800", color: colors.accent },
  chargeBtn: { marginTop: spacing.sm },
});
