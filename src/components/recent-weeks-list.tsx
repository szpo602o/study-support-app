import {
  ratingCssVar,
  studyRatingLabel,
  type StudyRating,
} from "@/lib/study-rating";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

type WeekRow = {
  weekStart: string;
  label: string;
  days: { date: string; rating: StudyRating }[];
};

export function RecentWeeksList({ weeks }: { weeks: WeekRow[] }) {
  return (
    <section className="card p-4">
      <h2 className="text-sm font-medium text-[var(--color-ink)]">
        最近4週間
      </h2>

      <div className="mt-3 grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] items-center gap-y-0.5">
        <div />
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] text-[var(--color-muted)]"
          >
            {d}
          </div>
        ))}

        {weeks.map((week) => (
          <div key={week.weekStart} className="contents">
            <p className="pr-1 text-[11px] tabular-nums text-[var(--color-muted)]">
              {week.label}
            </p>
            {week.days.map((day) => (
              <div
                key={day.date}
                className="flex h-8 items-center justify-center"
              >
                <span
                  className="text-base font-bold leading-none"
                  style={{ color: ratingCssVar(day.rating) }}
                >
                  {studyRatingLabel(day.rating)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
