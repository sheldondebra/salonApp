"use client";

import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgePercent,
  Calculator,
  FileText,
  Gift,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  PieChart,
  Receipt,
  Scale,
  Settings,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { SplitPageLayout } from "@/components/layout/page-layout";
import { SectionSidebar } from "@/components/shared/section-sidebar";

export type FinanceNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const financeNavItems: FinanceNavItem[] = [
  { href: "overview", label: "Overview", icon: LayoutDashboard, description: "Your money at a glance" },
  { href: "transactions", label: "Transaction history", icon: ArrowLeftRight, description: "All payments in one place" },
  { href: "payments", label: "Payments", icon: Smartphone, description: "Mobile money and card collections" },
  { href: "invoices", label: "Invoices", icon: FileText, description: "Bill clients and send receipts" },
  { href: "expenses", label: "Expenses", icon: Receipt, description: "Track rent, supplies, and costs" },
  { href: "payroll", label: "Payroll", icon: Users, description: "Staff pay and amounts due" },
  { href: "commissions", label: "Commissions", icon: BadgePercent, description: "Staff earnings by service" },
  { href: "tips", label: "Tips", icon: HandCoins, description: "Tips collected at checkout" },
  { href: "wallet", label: "Wallet", icon: Wallet, description: "Your balance and payouts" },
  { href: "settlements", label: "Payouts", icon: Landmark, description: "Money sent to your bank" },
  { href: "taxes", label: "Taxes", icon: Calculator, description: "Tax rates and summaries" },
  { href: "prepaid-balances", label: "Prepaid balances", icon: Gift, description: "Gift cards, packages, memberships" },
  { href: "insights", label: "Insights", icon: Lightbulb, description: "Forecasts and smart alerts" },
  { href: "reports", label: "Profit & Loss", icon: PieChart, description: "Income, costs, and net profit" },
  { href: "reconciliation", label: "End-of-day cash", icon: Scale, description: "Match cash drawer to sales" },
  { href: "settings", label: "Settings", icon: Settings, description: "Finance preferences" },
];

type FinanceShellProps = {
  tenantSlug: string;
  children: React.ReactNode;
};

export function FinanceShell({ tenantSlug, children }: FinanceShellProps) {
  const pathname = usePathname();
  const base = `/${tenantSlug}/finance`;

  return (
    <SplitPageLayout
      sidebar={
        <SectionSidebar
          title="Money"
          subtitle="Payments, invoices, and reports"
          pathname={pathname}
          items={financeNavItems.map((item) => ({
            id: item.href,
            label: item.label,
            href: `${base}/${item.href}`,
            icon: item.icon,
          }))}
        />
      }
    >
      <div className="w-full min-w-0">{children}</div>
    </SplitPageLayout>
  );
}
