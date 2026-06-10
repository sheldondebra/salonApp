"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { useAbilities } from "@/hooks/use-abilities";
import { formatMoney } from "@/lib/format/money";
import type { GiftCard, GiftCardLiability, GiftCardLookup } from "@/lib/api/types";

type GiftCardsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function GiftCardsView({ tenantSlug, currency = "GHS" }: GiftCardsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.gift_cards.create);

  const [tab, setTab] = useState("sales");
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [liability, setLiability] = useState<GiftCardLiability | null>(null);
  const [lookup, setLookup] = useState<GiftCardLookup | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleForm, setSaleForm] = useState({
    amount: "100",
    purchaser_name: "",
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    message: "",
  });

  const issuedValue = useMemo(
    () => giftCards.reduce((sum, card) => sum + card.initial_balance_cents, 0),
    [giftCards]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [cardsRes, liabilityRes] = await Promise.all([
        client.get<{ data: GiftCard[] }>(`/${tenantSlug}/gift-cards?per_page=50`),
        client.get<GiftCardLiability | { data: GiftCardLiability }>(`/${tenantSlug}/gift-cards/liability`),
      ]);
      setGiftCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
      setLiability(
        liabilityRes && typeof liabilityRes === "object" && "data" in liabilityRes
          ? liabilityRes.data
          : (liabilityRes as GiftCardLiability)
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load gift cards");
      setGiftCards([]);
      setLiability(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createGiftCard() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/gift-cards`, {
        initial_balance_cents: Math.round(Number(saleForm.amount || 0) * 100),
        purchaser_name: saleForm.purchaser_name || null,
        recipient_name: saleForm.recipient_name || null,
        recipient_email: saleForm.recipient_email || null,
        recipient_phone: saleForm.recipient_phone || null,
        message: saleForm.message || null,
      });
      toast.success("Gift card issued");
      setSaleForm({
        amount: "100",
        purchaser_name: "",
        recipient_name: "",
        recipient_email: "",
        recipient_phone: "",
        message: "",
      });
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not issue gift card");
    } finally {
      setSaving(false);
    }
  }

  async function runLookup() {
    if (!lookupCode.trim()) {
      toast.error("Enter a gift card code");
      return;
    }
    setSaving(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<GiftCardLookup | { data: GiftCardLookup }>(
        `/${tenantSlug}/gift-cards/lookup?code=${encodeURIComponent(lookupCode.trim())}`
      );
      setLookup("data" in result ? result.data : result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not look up gift card");
      setLookup(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Issued cards" value={String(giftCards.length)} icon={CreditCard} />
        <MetricCard title="Issued value" value={formatMoney(issuedValue, currency)} icon={Wallet} />
        <MetricCard
          title="Outstanding liability"
          value={formatMoney(liability?.outstanding_balance_cents ?? 0, currency)}
          icon={Wallet}
        />
        <MetricCard title="Active balances" value={String(liability?.active_count ?? 0)} icon={CreditCard} />
      </div>

      <PageTabs
        tabs={[
          { id: "sales", label: "Sales" },
          { id: "lookup", label: "Lookup" },
          { id: "liability", label: "Liability" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "sales" ? (
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Sell gift card</CardTitle>
              <CardDescription>Issue a new stored-value card for a client or walk-in guest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Amount ({currency})</Label>
                <Input type="number" min={0} step="0.01" value={saleForm.amount} onChange={(event) => setSaleForm((current) => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Purchaser</Label>
                <Input value={saleForm.purchaser_name} onChange={(event) => setSaleForm((current) => ({ ...current, purchaser_name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Input value={saleForm.recipient_name} onChange={(event) => setSaleForm((current) => ({ ...current, recipient_name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Recipient email</Label>
                <Input value={saleForm.recipient_email} onChange={(event) => setSaleForm((current) => ({ ...current, recipient_email: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Recipient phone</Label>
                <Input value={saleForm.recipient_phone} onChange={(event) => setSaleForm((current) => ({ ...current, recipient_phone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  value={saleForm.message}
                  onChange={(event) => setSaleForm((current) => ({ ...current, message: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                />
              </div>
              <Button className="w-full rounded-xl" disabled={!canCreate || saving} onClick={() => void createGiftCard()}>
                {saving ? "Issuing…" : "Issue gift card"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Activity history</CardTitle>
              <CardDescription>Recent sold cards and their remaining balances.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    id: "code",
                    header: "Code",
                    mobilePrimary: true,
                    cell: (row) => (
                      <div>
                        <p className="font-medium">{row.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.recipient_name || row.purchaser_name || "Recipient not set"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: "balance",
                    header: "Balance",
                    cell: (row) => formatMoney(row.balance_cents, currency),
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (row) => <span className="capitalize">{row.status}</span>,
                  },
                  {
                    id: "sold",
                    header: "Sold",
                    cell: (row) => row.sold_at ? new Date(row.sold_at).toLocaleDateString() : "Today",
                  },
                ]}
                data={giftCards}
                rowKey={(row) => String(row.id)}
                loading={loading}
                emptyIcon={CreditCard}
                emptyTitle="No gift cards sold yet"
                emptyDescription="Sold gift cards appear here for balance tracking and support lookups."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "lookup" ? (
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Lookup balance</CardTitle>
              <CardDescription>Find a card by code for support or POS verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Gift card code</Label>
                <Input value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} placeholder="e.g. GC-1024" />
              </div>
              <Button className="w-full rounded-xl" disabled={saving} onClick={() => void runLookup()}>
                <Search className="mr-2 h-4 w-4" />
                Lookup
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Lookup result</CardTitle>
              <CardDescription>Latest balance and activity for the searched card.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lookup?.gift_card ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard title="Code" value={lookup.gift_card.code} icon={CreditCard} />
                    <MetricCard title="Balance" value={formatMoney(lookup.gift_card.balance_cents, currency)} icon={Wallet} />
                    <MetricCard title="Status" value={lookup.gift_card.status} icon={CreditCard} />
                  </div>
                  <DataTable
                    columns={[
                      { id: "type", header: "Type", mobilePrimary: true, cell: (row) => row.type },
                      { id: "amount", header: "Amount", cell: (row) => formatMoney(row.amount_cents, currency) },
                      { id: "balance", header: "Balance after", cell: (row) => formatMoney(row.balance_after_cents, currency) },
                      { id: "date", header: "When", cell: (row) => row.occurred_at ? new Date(row.occurred_at).toLocaleString() : "Now" },
                    ]}
                    data={lookup.transactions}
                    rowKey={(row) => String(row.id)}
                    emptyIcon={Wallet}
                    emptyTitle="No transactions yet"
                    emptyDescription="This card has not been redeemed or adjusted yet."
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Run a lookup to see card details and history.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "liability" && liability ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Liability by status</CardTitle>
              <CardDescription>Monitor the outstanding balance you still owe across active cards.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { id: "status", header: "Status", mobilePrimary: true, cell: (row) => row.status },
                  { id: "count", header: "Cards", cell: (row) => row.count },
                  { id: "balance", header: "Balance", cell: (row) => formatMoney(row.balance_cents, currency) },
                ]}
                data={liability.by_status}
                rowKey={(row) => row.status}
                emptyIcon={Wallet}
                emptyTitle="No balance buckets yet"
                emptyDescription="Liability buckets appear after gift cards are sold."
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Month summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Issued this month</span>
                <span className="font-medium">{formatMoney(liability.issued_this_month_cents, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Redeemed this month</span>
                <span className="font-medium">{formatMoney(liability.redeemed_this_month_cents, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expired cards</span>
                <span className="font-medium">{liability.expired_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
