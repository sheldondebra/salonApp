export type BookingTenant = {
  id: number;
  name: string;
  slug: string;
  currency: string;
};

export type BookingService = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  price_formatted?: string;
  category?: { id: number; name: string } | null;
};

export type BookingStaff = {
  id: number;
  uuid: string;
  display_name: string;
  title: string | null;
};

export type BookingLocation = {
  id: number;
  name: string;
  label?: string;
};

export type BookingTimeSlot = {
  time: string;
  label: string;
  available: boolean;
};

export type BookingContext = {
  tenant: { id: number; name: string; slug: string; currency?: string };
  booking: {
    currency?: string;
    multiple_locations?: boolean;
    location_mode?: string;
    locations_count?: number;
  };
};

export type Appointment = {
  id: number;
  uuid: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_status?: string;
  amount_due_cents?: number;
  notes?: string | null;
  service?: BookingService;
  staff_member?: { id: number; display_name: string; title?: string | null };
  location?: BookingLocation;
};
