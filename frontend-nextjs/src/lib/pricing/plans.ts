export type PlanId = "starter" | "professional" | "enterprise";

export type PlanFeature = {
  label: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
};

export const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 49,
    description: "Solo stylists and boutique studios getting online.",
    cta: "Start free trial",
    highlighted: false,
  },
  {
    id: "professional" as const,
    name: "Professional",
    price: 129,
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
  { label: "Online booking", starter: true, professional: true, enterprise: true },
  { label: "Staff members", starter: "Up to 3", professional: "Up to 15", enterprise: "Unlimited" },
  { label: "Client accounts & profiles", starter: true, professional: true, enterprise: true },
  { label: "Social login (Google, Apple, Facebook)", starter: false, professional: true, enterprise: true },
  { label: "Loyalty points", starter: false, professional: true, enterprise: true },
  { label: "Saved favorites", starter: true, professional: true, enterprise: true },
  { label: "Custom domain (CNAME)", starter: false, professional: true, enterprise: true },
  { label: "Revenue analytics", starter: "Basic", professional: "Advanced", enterprise: "Advanced + API" },
  { label: "Role-based permissions", starter: "Owner + Staff", professional: "Full RBAC", enterprise: "Full RBAC + SSO" },
  { label: "WordPress widget", starter: false, professional: true, enterprise: true },
  { label: "Priority support", starter: false, professional: "Email", enterprise: "Dedicated CSM" },
];
