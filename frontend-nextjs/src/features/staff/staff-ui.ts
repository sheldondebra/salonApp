import type { StaffPayType } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

export const PAY_TYPE_LABELS: Record<StaffPayType, string> = {
  salary: "Fixed salary",
  hourly: "Hourly",
  commission: "Commission only",
  salary_commission: "Salary + commission",
  hourly_commission: "Hourly + commission",
};

export function formatPaySummary(
  summary: {
    pay_type: StaffPayType;
    base_salary_cents: number;
    hourly_rate_cents: number;
    commission_rate: number;
  },
  currency: string
): string {
  const parts: string[] = [];
  if (summary.pay_type.includes("salary") && summary.base_salary_cents > 0) {
    parts.push(`${formatMoney(summary.base_salary_cents, currency)}/mo`);
  }
  if (summary.pay_type.includes("hourly") && summary.hourly_rate_cents > 0) {
    parts.push(`${formatMoney(summary.hourly_rate_cents, currency)}/hr`);
  }
  if (summary.pay_type.includes("commission") && summary.commission_rate > 0) {
    parts.push(`${summary.commission_rate}% comm.`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Not set";
}

export function employmentStatusLabel(status?: string) {
  switch (status) {
    case "on_leave":
      return "On leave";
    case "terminated":
      return "Terminated";
    case "inactive":
      return "Inactive";
    default:
      return "Active";
  }
}
