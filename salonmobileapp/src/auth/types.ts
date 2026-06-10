export type MobilePortal = "admin" | "workplace" | "staff" | "client";

export type ApiUser = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  user_type: string;
  owned_tenant_slug?: string | null;
  roles?: string[];
};

export type MeTenant = {
  id: number;
  name: string;
  slug: string;
  is_owner: boolean;
};

export type MeResponse = {
  user: ApiUser;
  tenants: MeTenant[];
  platform_roles: string[];
  platform_permissions: string[];
};

export type LoginResponse = {
  token: string;
  user: ApiUser;
};
