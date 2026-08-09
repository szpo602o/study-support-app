import {
  ratingCssVar,
  studyRatingLabel,
} from "@/lib/study-rating";

const ORDER = [
  "doubleCircle",
  "circle",
  "triangle",
  "x",
] as const;

export function MonthSummaryCard({
  monthYearLabel,
  counts,
  circleOrAboveRate,
  unrecordedCount,
}: {
  monthYearLabel: string;
  counts: {
    doubleCircle: number;
    circle: number;
    triangle: number;
    x: number;
  };
  circleOrAboveRate: number | null;
  unrecordedCount: number;
}) {
  return (
    <section className="report-card p-4">
      <p className="school-label border-b border-[color-mix(in_oklab,var(--color-chalkboard)_18%,var(--color-line))] pb-2 text-sm text-[var(--color-chalkboard)]">
        {monthYearLabel}の学習
      </p>

      <p className="mt-3 text-[40px] font-bold tabular-nums leading-none tracking-tight text-[var(--color-ink)]">
        {circleOrAboveRate == null ? "—" : `${circleOrAboveRate}%`}
      </p>
      <p className="mt-1.5 text-sm text-[var(--color-muted)]">○以上率</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {ORDER.map((rating) => (
          <div key={rating} className="flex items-baseline gap-1">
            <span
              className="text-lg font-bold"
              style={{ color: ratingCssVar(rating) }}
            >
              {studyRatingLabel(rating)}
            </span>
            <span className="text-base font-semibold tabular-nums text-[var(--color-ink)]">
              {counts[rating]}
            </span>
          </div>
        ))}
      </div>

      {unrecordedCount > 0 && (
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          未入力 {unrecordedCount}日
        </p>
      )}
    </section>
  );
}
