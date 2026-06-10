export type StaffEmploymentStatus = "active" | "on_leave" | "inactive" | "terminated";

export type StaffMember = {
  id: number;
  uuid: string;
  location_id?: number | null;
  display_name: string;
  job_title?: string | null;
  title?: string | null;
  initials?: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_bookable: boolean;
  is_active: boolean;
  employment_status?: StaffEmploymentStatus;
  employment_type?: "full_time" | "part_time" | "contractor" | null;
  hire_date?: string | null;
  color_code?: string | null;
  appointments_count?: number;
  location?: { id: number; name: string } | null;
  user?: {
    id: number;
    name?: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
  };
};

export type StaffStats = {
  total: number;
  active: number;
  bookable: number;
  on_leave_today: number;
  available_now: number;
};

export type StaffLocation = {
  id: number;
  name: string;
};

export type StaffListParams = {
  q?: string;
  is_active?: boolean;
  is_bookable?: boolean;
  location_id?: number;
  employment_status?: string;
  title?: string;
  per_page?: number;
};

export type StaffWorkingHourDay = {
  id?: number;
  day_of_week: number;
  day_label: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type StaffWorkingHoursMeta = {
  has_custom_schedule?: boolean;
  summary?: { working_days: number; weekly_hours: number };
};

export type StaffServiceAssignment = {
  id: number;
  staff_member_id: number;
  service_id: number;
  custom_duration_minutes: number | null;
  custom_price_cents: number | null;
  effective_duration_minutes: number;
  effective_price_cents: number;
  is_active: boolean;
  service?: {
    id: number;
    name: string;
    duration_minutes: number;
    price_cents: number;
    category?: { id: number; name: string } | null;
  } | null;
};

export type StaffCatalogService = {
  id: number;
  name: string;
  duration_minutes: number;
  price_cents: number;
  category?: { id: number; name: string } | null;
};

export type StaffFormBody = {
  display_name: string;
  title?: string | null;
  email?: string;
  phone?: string | null;
  location_id?: number | null;
  bio?: string | null;
  employment_status?: StaffEmploymentStatus;
  employment_type?: string | null;
  hire_date?: string | null;
  color_code?: string | null;
  is_bookable?: boolean;
  is_active?: boolean;
};
