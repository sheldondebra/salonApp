export type ScheduleEventType = "appointment" | "break" | "time_off" | "unavailable";

export type ScheduleEvent = {
  id: string;
  type: ScheduleEventType;
  starts_at: string;
  ends_at: string;
  staff_member_id: number;
  location_id?: number | null;
  title: string;
  status?: string;
  color?: string | null;
  meta?: Record<string, unknown>;
};
