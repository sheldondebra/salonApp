import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { formatMoney } from "@/booking/format";
import {
  PAYMENT_REQUEST_REASON_LABELS,
  PAYMENT_REQUEST_STATUS_LABELS,
  type PaymentRequest,
} from "@/payment-requests/types";
import { colors, radii, spacing } from "@/theme/colors";

type PaymentRequestDetailPanelProps = {
  request: PaymentRequest;
  onVerify?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  busy?: "verify" | "cancel" | "retry" | null;
  canVerify?: boolean;
  canCancel?: boolean;
  canRetry?: boolean;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function statusColor(status: string): string {
  if (status === "success") return "#059669";
  if (status === "failed" || status === "cancelled") return colors.destructive;
  if (status === "expired") return colors.mutedForeground;
  if (status === "processing") return colors.primaryDark;
  return colors.mutedForeground;
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function gatewayLabel(gateway: string): string {
  if (gateway === "mtn_momo") return "MTN MoMo Direct";
  return gateway;
}

export function PaymentRequestDetailPanel({
  request,
  onVerify,
  onCancel,
  onRetry,
  busy,
  canVerify,
  canCancel,
  canRetry,
}: PaymentRequestDetailPanelProps) {
  const statusLabel = PAYMENT_REQUEST_STATUS_LABELS[request.status] ?? request.status;
  const reasonLabel = PAYMENT_REQUEST_REASON_LABELS[request.reason] ?? request.reason;

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.amount}>{formatMoney(request.amount_cents, request.currency)}</Text>
        <Text style={styles.ref}>{request.reference}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${statusColor(request.status)}22` }]}>
            <Text style={[styles.badgeText, { color: statusColor(request.status) }]}>{statusLabel}</Text>
          </View>
          <View style={styles.badgeMuted}>
            <Text style={styles.badgeMutedText}>{gatewayLabel(request.gateway)}</Text>
          </View>
          {request.provider_status ? (
            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>MTN: {request.provider_status}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {(canVerify || canCancel || canRetry) && (
        <View style={styles.actions}>
          {canVerify && onVerify ? (
            <Button
              label={busy === "verify" ? "Refreshing…" : "Refresh status"}
              variant="secondary"
              onPress={onVerify}
            />
          ) : null}
          {canRetry && onRetry ? (
            <Button label={busy === "retry" ? "Retrying…" : "Retry MTN"} variant="secondary" onPress={onRetry} />
          ) : null}
          {canCancel && onCancel ? (
            <Button label={busy === "cancel" ? "Cancelling…" : "Cancel"} variant="secondary" onPress={onCancel} />
          ) : null}
        </View>
      )}

      <Card>
        <View style={styles.pinNotice}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.pinText}>
            Customer enters MoMo PIN only on their own phone. Never ask for their PIN.
          </Text>
        </View>
      </Card>

      <Card>
        <InfoRow label="Customer" value={request.customer?.name ?? "—"} />
        <InfoRow label="Phone" value={request.phone} />
        {request.email ? <InfoRow label="Email" value={request.email} /> : null}
        <InfoRow label="Reason" value={reasonLabel} />
        {request.description ? <InfoRow label="Note" value={request.description} /> : null}
        {request.requested_by ? <InfoRow label="Requested by" value={request.requested_by.name} /> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Activity</Text>
        <InfoRow label="Created" value={formatWhen(request.created_at)} />
        {request.status_checked_at ? (
          <InfoRow label="Last status check" value={formatWhen(request.status_checked_at)} />
        ) : null}
        {request.callback_received_at ? (
          <InfoRow label="MTN callback" value={formatWhen(request.callback_received_at)} />
        ) : null}
        {request.expires_at ? <InfoRow label="Expires" value={formatWhen(request.expires_at)} /> : null}
        {request.paid_at ? <InfoRow label="Paid" value={formatWhen(request.paid_at)} /> : null}
        {request.cancelled_at ? <InfoRow label="Cancelled" value={formatWhen(request.cancelled_at)} /> : null}
        {request.external_reference ? (
          <InfoRow label="MTN transaction ID" value={request.external_reference} />
        ) : null}
        {request.failed_reason ? <InfoRow label="Failure" value={request.failed_reason} /> : null}
      </Card>

      {request.booking ? (
        <Card>
          <InfoRow label="Linked booking" value={request.booking.service_name ?? "Appointment"} />
        </Card>
      ) : null}
      {request.pos_sale ? (
        <Card>
          <InfoRow
            label="Linked POS sale"
            value={request.pos_sale.sale_number ?? request.pos_sale.uuid.slice(0, 8)}
          />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  hero: { gap: 4, paddingBottom: spacing.sm },
  amount: { fontSize: 28, fontWeight: "700", color: colors.primaryForeground },
  ref: { fontFamily: "monospace", fontSize: 12, color: colors.mutedForeground },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badgeMuted: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeMutedText: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  actions: { gap: spacing.sm },
  pinNotice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  pinText: { flex: 1, fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryForeground,
    marginBottom: spacing.sm,
  },
  infoRow: { marginBottom: spacing.sm },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: colors.mutedForeground,
  },
  infoValue: { fontSize: 15, fontWeight: "600", color: colors.primaryForeground, marginTop: 2 },
});
