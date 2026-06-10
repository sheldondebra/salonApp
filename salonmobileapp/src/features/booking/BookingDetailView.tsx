import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DetailInfoRow } from "@/components/ui/DetailInfoRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  formatAppointmentDate,
  formatBookedVia,
  formatDurationMinutes,
  formatMoney,
  formatStatusLabel,
  formatTimeRange,
} from "@/booking/format";
import type { Appointment } from "@/booking/types";
import {
  BOOKING_STATUSES,
  paymentTheme,
  statusActionIcon,
  statusTheme,
  type BookingStatus,
} from "@/features/booking/bookingDetailTheme";
import { colors, radii, spacing } from "@/theme/colors";

type BookingDetailViewProps = {
  appointment: Appointment;
  saving?: boolean;
  error?: string;
  onBack: () => void;
  onRefresh?: () => void;
  onSetStatus: (status: BookingStatus) => void;
  onRequestMomo?: () => void;
  showSalon?: boolean;
};

export function BookingDetailView({
  appointment: apt,
  saving,
  error,
  onBack,
  onRefresh,
  onSetStatus,
  onRequestMomo,
  showSalon,
}: BookingDetailViewProps) {
  const { isTablet, isWide } = useResponsiveLayout();
  const [showMore, setShowMore] = useState(false);

  const status = statusTheme(apt.status);
  const pay = paymentTheme(apt.payment_status);
  const amountCents = apt.amount_due_cents ?? apt.service?.price_cents ?? 0;
  const depositCents = apt.deposit_paid_cents ?? 0;
  const balanceCents = Math.max(0, amountCents - depositCents);
  const duration = apt.service?.duration_minutes;

  const hero = (
    <Card style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroTitleCol}>
          <Text style={styles.serviceName}>{apt.service?.name ?? "Appointment"}</Text>
          {apt.service?.category?.name ? (
            <Text style={styles.category}>{apt.service.category.name}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={16} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {formatStatusLabel(apt.status)}
          </Text>
        </View>
      </View>

      <View style={styles.heroMeta}>
        <View style={styles.heroMetaItem}>
          <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          <View>
            <Text style={styles.heroMetaLabel}>Date</Text>
            <Text style={styles.heroMetaValue}>{formatAppointmentDate(apt.starts_at)}</Text>
          </View>
        </View>
        <View style={styles.heroMetaItem}>
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <View>
            <Text style={styles.heroMetaLabel}>Time</Text>
            <Text style={styles.heroMetaValue}>
              {formatTimeRange(apt.starts_at, apt.ends_at)}
            </Text>
          </View>
        </View>
        {duration ? (
          <View style={styles.heroMetaItem}>
            <Ionicons name="timer-outline" size={18} color={colors.accent} />
            <View>
              <Text style={styles.heroMetaLabel}>Duration</Text>
              <Text style={styles.heroMetaValue}>{formatDurationMinutes(duration)}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Card>
  );

  const paymentSummary = (
    <Card style={styles.paymentCard}>
      <SectionHeader title="Payment" />
      <View style={styles.paymentGrid}>
        <PaymentPill
          icon="pricetag-outline"
          label="Service"
          value={formatMoney(apt.service?.price_cents ?? amountCents, "USD")}
        />
        <PaymentPill
          icon="wallet-outline"
          label="Deposit"
          value={formatMoney(depositCents, "USD")}
        />
        <PaymentPill
          icon="cash-outline"
          label="Balance due"
          value={formatMoney(balanceCents, "USD")}
          highlight
        />
      </View>
      <DetailInfoRow
        icon={pay.icon}
        label="Payment status"
        value={formatStatusLabel(apt.payment_status ?? "unpaid")}
        iconTint={pay.color}
        last
      />
    </Card>
  );

  const peopleDetails = (
    <Card>
      <SectionHeader title="People & place" />
      <DetailInfoRow
        icon="person-outline"
        label="Client"
        value={apt.client?.name ?? "Walk-in / guest"}
        hint={[apt.client?.email, apt.client?.phone].filter(Boolean).join(" · ") || undefined}
      />
      <DetailInfoRow
        icon="cut-outline"
        label="Stylist"
        value={apt.staff_member?.display_name ?? "Any available"}
        hint={apt.staff_member?.title ?? undefined}
      />
      {apt.location?.name ? (
        <DetailInfoRow
          icon="location-outline"
          label="Location"
          value={apt.location.name}
          last={!showSalon}
        />
      ) : null}
      {showSalon && apt.tenant ? (
        <DetailInfoRow
          icon="business-outline"
          label="Salon"
          value={apt.tenant.name}
          hint={apt.tenant.slug}
          last
        />
      ) : null}
    </Card>
  );

  const bookingDetails = (
    <Card>
      <SectionHeader title="Booking info" />
      <DetailInfoRow
        icon="globe-outline"
        label="Booked via"
        value={formatBookedVia(apt.booked_via)}
      />
      <DetailInfoRow
        icon="document-text-outline"
        label="Reference"
        value={apt.uuid.slice(0, 8).toUpperCase()}
        hint={`Full ID · ${apt.uuid}`}
        last={!apt.notes}
      />
      {apt.notes ? (
        <DetailInfoRow
          icon="chatbox-ellipses-outline"
          label="Notes"
          value={apt.notes}
          last
        />
      ) : null}
    </Card>
  );

  const moreDetails = (
    <Card>
      <Pressable
        onPress={() => setShowMore((v) => !v)}
        style={styles.moreToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: showMore }}
      >
        <View style={styles.moreToggleLeft}>
          <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
          <Text style={styles.moreToggleText}>
            {showMore ? "Hide details" : "Show more details"}
          </Text>
        </View>
        <Ionicons
          name={showMore ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>
      {showMore ? (
        <View style={styles.moreBody}>
          {apt.service?.description ? (
            <DetailInfoRow
              icon="reader-outline"
              label="Service description"
              value={apt.service.description}
            />
          ) : null}
          {apt.booking_group_id ? (
            <DetailInfoRow
              icon="layers-outline"
              label="Group booking"
              value={apt.booking_group_id}
            />
          ) : null}
          <DetailInfoRow icon="finger-print-outline" label="Appointment ID" value={apt.uuid} last />
        </View>
      ) : null}
    </Card>
  );

  const statusActions = (
    <Card>
      <SectionHeader title="Actions" />
      {onRequestMomo && apt.payment_status !== "paid" ? (
        <Button
          label="Request MoMo payment"
          variant="secondary"
          onPress={onRequestMomo}
          style={styles.momoBtn}
        />
      ) : null}
      <Text style={styles.actionsHint}>Tap to update appointment status</Text>
      <View style={styles.statusGrid}>
        {BOOKING_STATUSES.map((s) => {
          const active = apt.status === s;
          const theme = statusTheme(s);
          return (
            <Pressable
              key={s}
              onPress={() => onSetStatus(s)}
              disabled={saving}
              style={[
                styles.statusChip,
                active && { backgroundColor: theme.bg, borderColor: theme.color },
              ]}
            >
              {saving && active ? (
                <ActivityIndicator size="small" color={theme.color} />
              ) : (
                <Ionicons
                  name={statusActionIcon(s)}
                  size={22}
                  color={active ? theme.color : colors.mutedForeground}
                />
              )}
              <Text
                style={[
                  styles.statusChipLabel,
                  active && { color: theme.color, fontWeight: "700" },
                ]}
              >
                {formatStatusLabel(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Card>
  );

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.black} />
          <Text style={styles.backText}>Bookings</Text>
        </Pressable>
        {onRefresh ? (
          <Pressable onPress={onRefresh} style={styles.iconBtn} accessibilityLabel="Refresh">
            <Ionicons name="refresh-outline" size={22} color={colors.primaryForeground} />
          </Pressable>
        ) : null}
      </View>

      {hero}

      {isTablet || isWide ? (
        <View style={styles.split}>
          <View style={styles.splitMain}>
            {peopleDetails}
            {bookingDetails}
            {moreDetails}
          </View>
          <View style={styles.splitSide}>
            {paymentSummary}
            {statusActions}
          </View>
        </View>
      ) : (
        <>
          {paymentSummary}
          {peopleDetails}
          {statusActions}
          {bookingDetails}
          {moreDetails}
        </>
      )}

      <Button label="Back to all bookings" variant="secondary" onPress={onBack} />
    </View>
  );
}

function PaymentPill({
  icon,
  label,
  value,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[pillStyles.pill, highlight && pillStyles.pillHighlight]}>
      <Ionicons name={icon} size={18} color={highlight ? colors.accent : colors.mutedForeground} />
      <Text style={pillStyles.label}>{label}</Text>
      <Text style={[pillStyles.value, highlight && pillStyles.valueHighlight]}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.muted,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 4,
    alignItems: "flex-start",
  },
  pillHighlight: {
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  label: { fontSize: 10, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase" },
  value: { fontSize: 15, fontWeight: "700", color: colors.black },
  valueHighlight: { color: colors.accent },
});

const styles = StyleSheet.create({
  root: { gap: spacing.md, paddingBottom: spacing.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: { fontSize: 16, fontWeight: "600", color: colors.black },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { gap: spacing.md },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  heroTitleCol: { flex: 1, gap: 4 },
  serviceName: { fontSize: 22, fontWeight: "800", color: colors.black, letterSpacing: -0.3 },
  category: { fontSize: 13, fontWeight: "600", color: colors.accent },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  heroMeta: { gap: spacing.md },
  heroMetaItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  heroMetaLabel: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase" },
  heroMetaValue: { fontSize: 15, fontWeight: "600", color: colors.black, marginTop: 2 },
  split: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  splitMain: { flex: 1.35, gap: spacing.md, minWidth: 0 },
  splitSide: { flex: 1, gap: spacing.md, minWidth: 280, maxWidth: 400 },
  paymentCard: { gap: 0 },
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionsHint: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  momoBtn: { marginBottom: spacing.sm },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusChip: {
    width: "31%",
    minWidth: 100,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "capitalize",
    textAlign: "center",
  },
  moreToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  moreToggleLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  moreToggleText: { fontSize: 15, fontWeight: "700", color: colors.black },
  moreBody: { marginTop: spacing.xs },
  error: { color: colors.destructive, fontSize: 14, marginTop: spacing.md },
});
