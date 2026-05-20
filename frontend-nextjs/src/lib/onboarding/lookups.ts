import type { ComboboxOption } from "@/components/ui/combobox";

export const CURRENCY_OPTIONS: ComboboxOption[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "GHS", label: "GHS — Ghana Cedi" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "KES", label: "KES — Kenyan Shilling" },
];

export const TIMEZONE_OPTIONS: ComboboxOption[] = [
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Africa/Accra", label: "Accra (Ghana)" },
  { value: "Africa/Lagos", label: "Lagos (Nigeria)" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "UTC", label: "UTC" },
];

export const COUNTRY_OPTIONS: ComboboxOption[] = [
  { value: "US|United States", label: "United States" },
  { value: "GH|Ghana", label: "Ghana" },
  { value: "NG|Nigeria", label: "Nigeria" },
  { value: "GB|United Kingdom", label: "United Kingdom" },
  { value: "CA|Canada", label: "Canada" },
  { value: "AU|Australia", label: "Australia" },
  { value: "ZA|South Africa", label: "South Africa" },
  { value: "KE|Kenya", label: "Kenya" },
  { value: "FR|France", label: "France" },
  { value: "DE|Germany", label: "Germany" },
];

export const US_STATE_OPTIONS: ComboboxOption[] = [
  "Alabama", "Alaska", "Arizona", "California", "Colorado", "Florida", "Georgia",
  "Illinois", "Maryland", "Massachusetts", "New York", "North Carolina", "Ohio",
  "Pennsylvania", "Texas", "Virginia", "Washington",
].map((s) => ({ value: s, label: s }));

export function parseCountryValue(value: string): { code: string; name: string } {
  const [code, name] = value.split("|");
  return { code: code || value.slice(0, 2), name: name || value };
}

export function formatCountryValue(code: string, name: string) {
  return `${code}|${name}`;
}
