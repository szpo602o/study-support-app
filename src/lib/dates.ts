import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

/** アプリ全体の「今日」は日本時間で揃える（Vercel 等の UTC 環境でもずれない） */
export const APP_TIMEZONE = "Asia/Tokyo";

/** Instant → Asia/Tokyo のカレンダー日付 (YYYY-MM-DD) */
export function todayDateString(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * YYYY-MM-DD を日付演算用の Date にする。
 * 正午固定で、サーバー TZ や DST による日またぎを避ける。
 */
function calendarDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** 月曜開始の週（基準日は Asia/Tokyo のカレンダー） */
export function getWeekBounds(date: Date = new Date()) {
  const anchor = calendarDate(todayDateString(date));
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return {
    start,
    end,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

export function weekLabel(startDate: string) {
  const d = calendarDate(startDate);
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
}

export function formatJaDate(dateStr: string) {
  return format(calendarDate(dateStr), "M月d日(E)", { locale: ja });
}

export function formatJaMonthDay(dateStr: string) {
  return format(calendarDate(dateStr), "M月d日");
}

export function daysUntil(dateStr: string, from: Date = new Date()) {
  return differenceInCalendarDays(
    calendarDate(dateStr),
    calendarDate(todayDateString(from)),
  );
}

export function isDateAfter(a: string, b: string) {
  return a > b;
}

export function addDaysToDateString(dateStr: string, days: number) {
  return format(addDays(calendarDate(dateStr), days), "yyyy-MM-dd");
}
