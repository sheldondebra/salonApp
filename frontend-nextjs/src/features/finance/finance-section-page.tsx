import {
  FinancePlaceholderView,
  type FinancePlaceholderIconName,
} from "@/features/finance/finance-placeholder-view";

export function financePlaceholderPage(
  iconName: FinancePlaceholderIconName,
  title: string,
  description: string
) {
  return function FinanceSectionPlaceholderPage() {
    return <FinancePlaceholderView iconName={iconName} title={title} description={description} />;
  };
}
