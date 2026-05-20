"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type WalletData = {
  balance_credits: number;
  total_used: number;
  total_purchased: number;
  low_balance_threshold: number;
  is_low_balance: boolean;
};

type TxRow = {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
};

export function TenantSmsWalletCard({ tenantSlug }: { tenantSlug: string }) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const client = createApiClient(getApiClientOptions(undefined, tenantSlug));
    Promise.all([
      client.get<{ data: WalletData }>(`/${tenantSlug}/sms/wallet`),
      client.get<{ data: TxRow[] }>(`/${tenantSlug}/sms/wallet/transactions?per_page=15`),
    ])
      .then(([w, tx]) => {
        setWallet(w.data);
        setTransactions(Array.isArray(tx.data) ? tx.data : []);
      })
      .catch(() => {
        setWallet(null);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  if (!wallet) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-soft border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" />
          SMS credits
        </CardTitle>
        <CardDescription>Prepaid SMS balance for booking and marketing messages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-primary">{wallet.balance_credits}</p>
            <p className="text-sm text-muted-foreground">credits remaining</p>
          </div>
          {wallet.is_low_balance ? (
            <Badge variant="outline" className="border-amber-300 text-amber-800 gap-1">
              <AlertTriangle className="h-3 w-3" />
              Low balance
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Used {wallet.total_used} · Purchased {wallet.total_purchased} · Alert below {wallet.low_balance_threshold}
        </p>

        {transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 8).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="capitalize text-xs">{tx.type}</TableCell>
                  <TableCell className={tx.amount >= 0 ? "text-emerald-600 text-xs" : "text-destructive text-xs"}>
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </TableCell>
                  <TableCell className="text-xs">{tx.balance_after}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
