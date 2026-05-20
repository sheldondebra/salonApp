export type OnboardingStepKey =
  | "business"
  | "business_type"
  | "services"
  | "gallery"
  | "contact"
  | "branding"
  | "location"
  | "review";

export type OnboardingStep = {
  key: OnboardingStepKey;
  label: string;
  completed: boolean;
  completed_at: string | null;
  data: Record<string, unknown>;
};

export type OnboardingProgress = {
  steps: Record<string, OnboardingStep>;
  current_step: OnboardingStepKey;
  percent: number;
  completed_count: number;
  total: number;
  tenant_slug?: string | null;
  tenant_uuid?: string | null;
  business_type?: string | null;
  business_type_label?: string | null;
};

export type OnboardingServiceRow = {
  id?: number;
  uuid?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  service_category_id?: number | null;
  category?: { id: number; name: string };
};

export type OnboardingExtraContact = {
  label: string;
  phone: string;
  email: string;
};

export type OnboardingGalleryRow = {
  title?: string;
  before_image_url: string;
  after_image_url: string;
  caption?: string;
};

export type PortfolioGalleryItem = {
  id: number;
  uuid: string;
  title: string | null;
  before_image_url: string;
  after_image_url: string;
  caption: string | null;
  sort_order: number;
  is_published: boolean;
  service_id: number | null;
};
