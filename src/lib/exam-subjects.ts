/** 中小企業診断士1次試験の科目・年度表示 */

export const EXAM_TYPE_SHINDANSHI_1ST = "shindanshi_1st" as const;

export type ExamType = typeof EXAM_TYPE_SHINDANSHI_1ST;

export const SHINDANSHI_1ST_SUBJECTS = [
  "経済学・経済政策",
  "財務・会計",
  "企業経営理論",
  "運営管理",
  "経営法務",
  "経営情報システム",
  "中小企業経営・中小企業政策",
] as const;

export type Shindanshi1stSubject = (typeof SHINDANSHI_1ST_SUBJECTS)[number];

/** 西暦 → 令和表記（令和1年=2019） */
export function toReiwaLabel(year: number): string {
  const reiwa = year - 2018;
  if (reiwa < 1) return String(year);
  return `R${reiwa}`;
}

/** 入力候補の年度（新しい順）。今年度を含む直近10年 */
export function recentExamYears(fromYear?: number): number[] {
  const base =
    fromYear ??
    Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
      }).format(new Date()),
    );
  return Array.from({ length: 10 }, (_, i) => base - i);
}

export function isShindanshi1stSubject(
  value: string,
): value is Shindanshi1stSubject {
  return (SHINDANSHI_1ST_SUBJECTS as readonly string[]).includes(value);
}
