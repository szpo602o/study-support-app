import {
  ratingCssVar,
  studyRatingLabel,
  type StudyRating,
} from "@/lib/study-rating";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

export function WeekDayStrip({
  days,
  todayDate,
}: {
  days: { date: string; rating: StudyRating }[];
  todayDate?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[280px] grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isToday = todayDate === day.date;
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-sm)] py-2 ${
                isToday ? "bg-[var(--color-accent-soft)]" : ""
              }`}
            >
              <span className="text-xs text-[var(--color-muted)]">
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                className="text-xl font-bold leading-none"
                style={{ color: ratingCssVar(day.rating) }}
              >
                {studyRatingLabel(day.rating)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RatingLegend() {
  const items: { rating: StudyRating; text: string }[] = [
    { rating: "doubleCircle", text: "90分以上" },
    { rating: "circle", text: "60〜89分" },
    { rating: "triangle", text: "1〜59分" },
    { rating: "x", text: "0分" },
    { rating: "unrecorded", text: "未入力" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
      {items.map((item) => (
        <li key={item.rating} className="flex items-center gap-1">
          <span
            className="font-bold"
            style={{ color: ratingCssVar(item.rating) }}
          >
            {studyRatingLabel(item.rating)}
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function RatingCounts({
  counts,
  circleOrAboveRate,
  totalMinutesLabel,
}: {
  counts: {
    doubleCircle: number;
    circle: number;
    triangle: number;
    x: number;
  };
  circleOrAboveRate: number | null;
  totalMinutesLabel?: string;
}) {
  const items: { rating: StudyRating; count: number }[] = [
    { rating: "doubleCircle", count: counts.doubleCircle },
    { rating: "circle", count: counts.circle },
    { rating: "triangle", count: counts.triangle },
    { rating: "x", count: counts.x },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {items.map((item) => (
          <div key={item.rating} className="flex items-baseline gap-1.5">
            <span
              className="text-lg font-bold"
              style={{ color: ratingCssVar(item.rating) }}
            >
              {studyRatingLabel(item.rating)}
            </span>
            <span className="text-lg font-semibold tabular-nums text-[var(--color-ink)]">
              {item.count}日
            </span>
          </div>
        ))}
      </div>
      <p className="text-[28px] font-bold tabular-nums leading-none text-[var(--color-ink)]">
        ○以上率{" "}
        {circleOrAboveRate === null ? "—" : `${circleOrAboveRate}%`}
      </p>
      {totalMinutesLabel && (
        <p className="text-sm text-[var(--color-muted)]">
          学習時間 {totalMinutesLabel}
        </p>
      )}
    </div>
  );
}
