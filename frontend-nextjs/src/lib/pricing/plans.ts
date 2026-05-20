export type PlanId = "starter" | "growth" | "professional" | "enterprise";

export type PlanFeature = {
  label: string;
  starter: boolean | string;
  growth: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
};

/** Display prices in GHS (matches API plan cents / 100). */
export const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 99,
    description: "Solo stylists and boutique studios getting online.",
    cta: "Start free trial",
    highlighted: false,
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: 499,
    description: "Busy salons with multiple staff and branches.",
    cta: "Start free trial",
    highlighted: false,
  },
  {
    id: "professional" as const,
    name: "Professional",
    price: 1299,
    description: "Growing teams with booking, loyalty, and analytics.",
    cta: "Start free trial",
    highlighted: true,
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: null,
    description: "Multi-location brands with custom domains and SSO.",
    cta: "Contact sales",
    highlighted: false,
  },
];

export const comparisonRows: PlanFeature[] = [
  { label: "Online booking", starter: true, growth: true, professional: true, enterprise: true },
  { label: "Staff members", starter: "Up to 3", growth: "Up to 8", professional: "Up to 15", enterprise: "Unlimited" },
  { label: "Client accounts & profiles", starter: true, growth: true, professional: true, enterprise: true },
  { label: "Social login (Google, Apple, Facebook)", starter: false, growth: true, professional: true, enterprise: true },
  { label: "Loyalty points", starter: false, growth: true, professional: true, enterprise: true },
  { label: "Saved favorites", starter: true, growth: true, professional: true, enterprise: true },
  { label: "Custom domain (CNAME)", starter: false, growth: true, professional: true, enterprise: true },
  { label: "Revenue analytics", starter: "Basic", growth: "Standard", professional: "Advanced", enterprise: "Advanced + API" },
  { label: "Role-based permissions", starter: "Owner + Staff", growth: "Team roles", professional: "Full RBAC", enterprise: "Full RBAC + SSO" },
  { label: "WordPress widget", starter: false, growth: true, professional: true, enterprise: true },
  { label: "Priority support", starter: false, growth: "Email", professional: "Email", enterprise: "Dedicated CSM" },
];
