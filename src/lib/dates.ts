import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

/** 月曜開始の週 */
export function getWeekBounds(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return {
    start,
    end,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

export function todayDateString(date: Date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function weekLabel(startDate: string) {
  const d = parseISO(startDate);
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
}

export function formatJaDate(dateStr: string) {
  return format(parseISO(dateStr), "M月d日(E)", { locale: ja });
}

export function daysUntil(dateStr: string, from: Date = new Date()) {
  return differenceInCalendarDays(parseISO(dateStr), from);
}

export function isDateAfter(a: string, b: string) {
  return a > b;
}

export function addDaysToDateString(dateStr: string, days: number) {
  return format(addDays(parseISO(dateStr), days), "yyyy-MM-dd");
}
