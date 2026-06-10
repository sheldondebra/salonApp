import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  SectionTitle,
  SelectChip,
  StepFlowCard,
  formatDateLabel,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchClients,
  fetchGiftCard,
  fetchGiftCards,
  lookupGiftCardByCode,
  redeemGiftCard,
  sellGiftCard,
  type ClientRow,
  type GiftCard,
  type GiftCardTransaction,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

type GiftCardDetail = GiftCard & { transactions?: GiftCardTransaction[] };

export function WorkplaceGiftCardsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<GiftCardDetail | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [sellAmount, setSellAmount] = useState("100");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("20");
  const [redeemNote, setRedeemNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [giftCardRes, clientRes] = await Promise.all([
        fetchGiftCards(auth, { per_page: 50 }),
        fetchClients(auth, { per_page: 20 }),
      ]);
      const nextGiftCards = giftCardRes.data ?? [];
      setGiftCards(nextGiftCards);
      setClients(clientRes.data ?? []);
      const firstCardId = nextGiftCards[0]?.id ?? null;
      setSelectedCardId((current) => current ?? firstCardId);
      setSelectedClientId((current) => current ?? clientRes.data?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load gift cards");
      setGiftCards([]);
    }
  }, [auth]);

  const loadCardDetail = useCallback(
    async (giftCardId: number) => {
      if (!auth) return;
      try {
        const detail = await fetchGiftCard(auth, giftCardId);
        setSelectedCard(detail);
      } catch {
        const fallback = giftCards.find((item) => item.id === giftCardId) ?? null;
        setSelectedCard(fallback);
      }
    },
    [auth, giftCards]
  );

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!selectedCardId) {
      setSelectedCard(null);
      return;
    }
    void loadCardDetail(selectedCardId);
  }, [loadCardDetail, selectedCardId]);

  const chosenCard = useMemo(
    () => selectedCard ?? giftCards.find((card) => card.id === selectedCardId) ?? null,
    [giftCards, selectedCard, selectedCardId]
  );

  const chosenTransactions = useMemo<GiftCardTransaction[]>(
    () =>
      chosenCard && "transactions" in chosenCard && Array.isArray(chosenCard.transactions)
        ? chosenCard.transactions
        : [],
    [chosenCard]
  );

  async function handleSellGiftCard() {
    if (!auth) return;
    const initialBalanceCents = Math.max(0, Math.round((Number.parseFloat(sellAmount) || 0) * 100));
    if (initialBalanceCents <= 0) {
      setError("Enter a gift card amount greater than zero.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await sellGiftCard(auth, {
        initial_balance_cents: initialBalanceCents,
        recipient_name: recipientName.trim() || null,
        recipient_email: recipientEmail.trim() || null,
        purchaser_user_id: selectedClientId,
        expires_at: expiryDate.trim() || null,
      });
      Alert.alert("Gift card sold", "The new gift card was created successfully.");
      setRecipientName("");
      setRecipientEmail("");
      setExpiryDate("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sell gift card");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookupCard() {
    if (!auth || !lookupCode.trim()) {
      setError("Enter a gift card code to look it up.");
      return;
    }
    setLookingUp(true);
    setError("");
    try {
      const detail = await lookupGiftCardByCode(auth, lookupCode.trim());
      setSelectedCardId(detail.id);
      setSelectedCard(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not find that gift card");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleRedeemGiftCard() {
    if (!auth || !chosenCard) {
      setError("Choose a gift card to redeem.");
      return;
    }
    const amountCents = Math.max(0, Math.round((Number.parseFloat(redeemAmount) || 0) * 100));
    if (amountCents <= 0) {
      setError("Enter a redemption amount greater than zero.");
      return;
    }
    setRedeeming(true);
    setError("");
    try {
      await redeemGiftCard(auth, chosenCard.id, {
        amount_cents: amountCents,
        note: redeemNote.trim() || null,
      });
      Alert.alert("Gift card redeemed", "The balance was reduced successfully.");
      setRedeemNote("");
      await load();
      await loadCardDetail(chosenCard.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not redeem gift card");
    } finally {
      setRedeeming(false);
    }
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return (
      <ResponsiveShell>
        <LoadingState message="Loading gift cards…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Gift cards" subtitle="Open balances, quick lookup, and mobile sales." />
      {giftCards.length === 0 ? (
        <EmptyState
          title="No gift cards yet"
          description="Sell a gift card from the flow on the right, then use this list for lookup and redemption."
        />
      ) : (
        giftCards.map((card) => {
          const selected = card.id === chosenCard?.id;
          return (
            <Pressable
              key={card.id}
              onPress={() => setSelectedCardId(card.id)}
              style={[styles.cardItem, selected && styles.cardItemSelected]}
            >
              <Text style={styles.cardTitle}>{card.code}</Text>
              <Text style={styles.cardMeta}>
                {formatMoney(card.balance_cents)} remaining · {card.status}
              </Text>
              <Text style={styles.cardMeta}>{card.recipient_name || "Walk-in or shared code"}</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>{chosenCard?.code ?? "Select a gift card"}</Text>
        <Text style={sharedStyles.muted}>
          {chosenCard
            ? `${formatMoney(chosenCard.balance_cents)} remaining · expires ${formatDateLabel(
                chosenCard.expires_at
              )}`
            : "Choose a gift card from the list or look one up by code."}
        </Text>
        {chosenCard ? (
          <View style={styles.detailStats}>
            <Card>
              <Text style={styles.metricLabel}>Initial</Text>
              <Text style={styles.metricValue}>{formatMoney(chosenCard.initial_balance_cents)}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Balance</Text>
              <Text style={styles.metricValue}>{formatMoney(chosenCard.balance_cents)}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={styles.metricValue}>{chosenCard.status}</Text>
            </Card>
          </View>
        ) : null}
      </Card>

      <StepFlowCard
        title="Sell gift card"
        description="A phone-first cashier flow for selling and emailing a new gift card."
        steps={[
          "Choose the purchaser or leave it as a walk-in sale.",
          "Enter the gift card amount and recipient details.",
          "Tap Sell gift card to issue the code and balance.",
        ]}
      >
        <View style={sharedStyles.rowWrap}>
          {clients.slice(0, 8).map((client) => (
            <SelectChip
              key={client.id}
              label={client.name}
              selected={client.id === selectedClientId}
              onPress={() => setSelectedClientId(client.id)}
            />
          ))}
        </View>
        <Input label="Amount" value={sellAmount} keyboardType="decimal-pad" onChangeText={setSellAmount} />
        <Input label="Recipient name" value={recipientName} onChangeText={setRecipientName} />
        <Input
          label="Recipient email"
          value={recipientEmail}
          keyboardType="email-address"
          onChangeText={setRecipientEmail}
        />
        <Input
          label="Expiry date"
          placeholder="YYYY-MM-DD"
          value={expiryDate}
          onChangeText={setExpiryDate}
        />
        {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
        <Button
          label={submitting ? "Selling…" : "Sell gift card"}
          onPress={() => void handleSellGiftCard()}
          loading={submitting}
        />
      </StepFlowCard>

      <StepFlowCard
        title="Redeem or lookup"
        description="Use a code for balance lookup, then redeem all or part of the gift card."
        steps={[
          "Enter the gift card code or tap a card from the list.",
          "Confirm the remaining balance and redemption amount.",
          "Tap Redeem gift card to record the transaction.",
        ]}
      >
        <Input label="Gift card code" value={lookupCode} onChangeText={setLookupCode} />
        <Button
          label={lookingUp ? "Looking up…" : "Lookup code"}
          variant="secondary"
          onPress={() => void handleLookupCard()}
          loading={lookingUp}
        />
        <Input
          label="Redeem amount"
          value={redeemAmount}
          keyboardType="decimal-pad"
          onChangeText={setRedeemAmount}
        />
        <Input label="Redemption note" value={redeemNote} onChangeText={setRedeemNote} />
        <Button
          label={redeeming ? "Redeeming…" : "Redeem gift card"}
          onPress={() => void handleRedeemGiftCard()}
          loading={redeeming}
          disabled={!chosenCard}
        />
      </StepFlowCard>

      <Card style={styles.detailCard}>
        <SectionTitle title="Recent transactions" subtitle="Latest activity for the selected gift card" />
        {chosenTransactions.length > 0 ? (
          chosenTransactions.slice(0, 6).map((transaction) => (
            <ListRow
              key={transaction.id}
              icon="swap-horizontal-outline"
              title={transaction.type}
              subtitle={transaction.note || `Balance after ${formatMoney(transaction.balance_after_cents)}`}
              right={formatMoney(transaction.amount_cents)}
            />
          ))
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Newly sold gift cards and future redemptions will appear here."
          />
        )}
      </Card>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Gift cards"
        subtitle="Sell, lookup, and redeem stored balances"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <IconStatGrid>
        <IconStatCard icon="gift-outline" label="Cards" value={String(giftCards.length)} />
        <IconStatCard
          icon="cash-outline"
          label="Open balance"
          value={formatMoney(giftCards.reduce((sum, card) => sum + card.balance_cents, 0))}
        />
        <IconStatCard
          icon="mail-outline"
          label="Email-ready"
          value={String(giftCards.filter((card) => !!card.recipient_email).length)}
        />
        <IconStatCard
          icon="qr-code-outline"
          label="Selected"
          value={chosenCard ? chosenCard.code : "None"}
        />
      </IconStatGrid>
      {useSplitLayout ? (
        <View style={sharedStyles.split}>
          {listPane}
          {detailPane}
        </View>
      ) : (
        <>
          {listPane}
          {detailPane}
        </>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  cardItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  cardItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  cardMeta: { fontSize: 13, color: colors.mutedForeground },
  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.primaryForeground },
  detailStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  metricValue: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
});
