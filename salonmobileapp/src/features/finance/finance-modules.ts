import type { Ionicons } from "@expo/vector-icons";

export type FinanceModule = {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  tint?: string;
};

export type FinanceModuleSection = {
  title: string;
  subtitle?: string;
  modules: FinanceModule[];
};

export const FINANCE_MODULE_SECTIONS: FinanceModuleSection[] = [
  {
    title: "Daily money",
    subtitle: "Collect, record, and track cash flow",
    modules: [
      {
        id: "invoices",
        label: "Invoices",
        subtitle: "Bill clients and send receipts",
        icon: "document-text-outline",
        route: "/workplace/finance/invoices",
        tint: "#D97706",
      },
      {
        id: "expenses",
        label: "Expenses",
        subtitle: "Rent, supplies, and operating costs",
        icon: "receipt-outline",
        route: "/workplace/finance/expenses",
        tint: "#64748B",
      },
      {
        id: "transactions",
        label: "Transaction history",
        subtitle: "All payments in one ledger",
        icon: "swap-horizontal-outline",
        route: "/workplace/finance/transactions",
        tint: "#0EA5E9",
      },
      {
        id: "payment-requests",
        label: "MoMo requests",
        subtitle: "Send mobile money payment links",
        icon: "phone-portrait-outline",
        route: "/workplace/payment-requests",
        tint: "#059669",
      },
      {
        id: "wallet",
        label: "Wallet",
        subtitle: "Available balance and ledger",
        icon: "wallet-outline",
        route: "/workplace/wallet",
        tint: "#7C3AED",
      },
      {
        id: "reconciliation",
        label: "End-of-day cash",
        subtitle: "Match drawer to POS sales",
        icon: "scale-outline",
        route: "/workplace/finance/reconciliation",
        tint: "#E879A6",
      },
    ],
  },
  {
    title: "Reports & insights",
    subtitle: "Understand profit, liabilities, and trends",
    modules: [
      {
        id: "insights",
        label: "Smart insights",
        subtitle: "Forecasts, warnings, and actions",
        icon: "bulb-outline",
        route: "/workplace/finance/insights",
        tint: "#F59E0B",
      },
      {
        id: "profit-loss",
        label: "Profit & loss",
        subtitle: "Income, costs, and net profit",
        icon: "pie-chart-outline",
        route: "/workplace/finance/profit-loss",
        tint: "#059669",
      },
      {
        id: "prepaid",
        label: "Prepaid balances",
        subtitle: "Gift cards, packages, memberships",
        icon: "gift-outline",
        route: "/workplace/finance/prepaid-balances",
        tint: "#7C3AED",
      },
    ],
  },
  {
    title: "Payroll & tax",
    subtitle: "Staff earnings and tax summaries",
    modules: [
      {
        id: "payroll",
        label: "Payroll",
        subtitle: "Estimated staff earnings",
        icon: "people-outline",
        route: "/workplace/finance/payroll",
        tint: "#0EA5E9",
      },
      {
        id: "tips",
        label: "Tips",
        subtitle: "Tips collected at checkout",
        icon: "heart-outline",
        route: "/workplace/finance/tips",
        tint: "#EC4899",
      },
      {
        id: "taxes",
        label: "Taxes & VAT",
        subtitle: "Rates and tax collected",
        icon: "calculator-outline",
        route: "/workplace/finance/taxes",
        tint: "#64748B",
      },
    ],
  },
];
