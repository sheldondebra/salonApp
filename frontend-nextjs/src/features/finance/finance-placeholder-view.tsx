"use client";

import {
  ArrowLeftRight,
  BadgePercent,
  Calculator,
  FileText,
  HandCoins,
  Landmark,
  PieChart,
  Receipt,
  Scale,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const financePlaceholderIcons = {
  ArrowLeftRight,
  BadgePercent,
  Calculator,
  FileText,
  HandCoins,
  Landmark,
  PieChart,
  Receipt,
  Scale,
  Settings,
  Users,
} as const satisfies Record<string, LucideIcon>;

export type FinancePlaceholderIconName = keyof typeof financePlaceholderIcons;

type FinancePlaceholderViewProps = {
  iconName: FinancePlaceholderIconName;
  title: string;
  description: string;
};

export function FinancePlaceholderView({ iconName, title, description }: FinancePlaceholderViewProps) {
  const Icon = financePlaceholderIcons[iconName];

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="py-12">
        <EmptyState icon={Icon} title={title} description={description} />
      </CardContent>
    </Card>
  );
}
