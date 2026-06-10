import { parseISO } from "date-fns";

export const SCHEDULE_HOUR_PX = 56;
export const SCHEDULE_DAY_START_HOUR = 8;
export const SCHEDULE_DAY_END_HOUR = 20;

export function scheduleMinutesFromDayStart(iso: string, dayStartHour: number): number {
  const d = parseISO(iso);
  return (d.getHours() - dayStartHour) * 60 + d.getMinutes();
}

export function scheduleEventStyle(
  startsAt: string,
  endsAt: string,
  dayStartHour = SCHEDULE_DAY_START_HOUR,
  dayEndHour = SCHEDULE_DAY_END_HOUR
) {
  const startMin = Math.max(0, scheduleMinutesFromDayStart(startsAt, dayStartHour));
  const endMin = Math.min(
    (dayEndHour - dayStartHour) * 60,
    scheduleMinutesFromDayStart(endsAt, dayStartHour)
  );
  const height = Math.max(24, ((endMin - startMin) / 60) * SCHEDULE_HOUR_PX);
  const top = (startMin / 60) * SCHEDULE_HOUR_PX;

  return { top, height };
}

export function scheduleHours(
  dayStartHour = SCHEDULE_DAY_START_HOUR,
  dayEndHour = SCHEDULE_DAY_END_HOUR
) {
  return Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i);
}

export function formatScheduleHour(h: number): string | null {
  if (h === SCHEDULE_DAY_START_HOUR || h % 2 === 0) {
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}${h >= 12 ? "pm" : "am"}`;
  }
  return null;
}
