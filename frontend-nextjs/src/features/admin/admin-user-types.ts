export type AdminUserTenant = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  status?: string;
  is_owner: boolean;
  joined_at?: string;
};

export type AdminLoginLog = {
  id: number;
  ip_address: string | null;
  device_label: string | null;
  user_agent: string | null;
  status: string;
  failure_reason: string | null;
  logged_in_at: string;
};

export type AdminUser = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string | null;
  user_type: string;
  account_intent?: string;
  onboarding_status?: string;
  selected_plan?: string | null;
  is_active: boolean;
  is_blocked: boolean;
  email_verified: boolean;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  last_login_device?: string | null;
  created_at?: string;
  deleted_at?: string | null;
  tenants?: AdminUserTenant[];
  tenants_count?: number;
  login_logs?: AdminLoginLog[];
};
