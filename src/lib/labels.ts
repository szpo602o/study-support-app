export const TIME_BUCKETS = [
  { value: "0", label: "0分" },
  { value: "1_14", label: "1〜14分" },
  { value: "15_29", label: "15〜29分" },
  { value: "30_59", label: "30〜59分" },
  { value: "60_119", label: "60〜119分" },
  { value: "120_plus", label: "120分以上" },
] as const;

export const ESTIMATE_CODES = [
  { value: "15", label: "15分", minutes: 15 },
  { value: "30", label: "30分", minutes: 30 },
  { value: "60", label: "60分", minutes: 60 },
  { value: "120", label: "120分", minutes: 120 },
  { value: "180_plus", label: "180分以上", minutes: 180 },
] as const;

export const INCOMPLETE_REASONS = [
  { value: "no_time", label: "時間不足" },
  { value: "overestimate", label: "見積もり過大" },
  { value: "priority_change", label: "優先度変更" },
  { value: "avoidance", label: "着手を避けた" },
  { value: "other", label: "その他" },
] as const;

export const INCOMPLETE_DISPOSITIONS = [
  { value: "recommit", label: "来週もやる" },
  { value: "defer", label: "延期" },
  { value: "drop", label: "やめる" },
] as const;

export const MILESTONE_DECISIONS = [
  { value: "catch_up", label: "取り戻す" },
  { value: "change_date", label: "期限変更" },
  { value: "shrink_scope", label: "範囲縮小" },
] as const;

export type TimeBucket = (typeof TIME_BUCKETS)[number]["value"];
export type EstimateCode = (typeof ESTIMATE_CODES)[number]["value"];
export type IncompleteReason = (typeof INCOMPLETE_REASONS)[number]["value"];
export type IncompleteDisposition =
  (typeof INCOMPLETE_DISPOSITIONS)[number]["value"];
export type MilestoneDecision = (typeof MILESTONE_DECISIONS)[number]["value"];

export function estimateMinutes(code: EstimateCode): number {
  return ESTIMATE_CODES.find((e) => e.value === code)?.minutes ?? 0;
}

export function timeBucketApproxMinutes(bucket: TimeBucket): number {
  switch (bucket) {
    case "0":
      return 0;
    case "1_14":
      return 7;
    case "15_29":
      return 22;
    case "30_59":
      return 45;
    case "60_119":
      return 90;
    case "120_plus":
      return 150;
  }
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
