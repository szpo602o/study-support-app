import {
  ratingCssVar,
  studyRatingLabel,
  type StudyRating,
} from "@/lib/study-rating";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

type Cell = {
  date: string | null;
  dayOfMonth: number | null;
  minutes: number | null;
  rating: StudyRating;
  isToday: boolean;
  isFuture: boolean;
};

export function CompactMonthCalendar({ cells }: { cells: Cell[] }) {
  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <section className="card overflow-hidden p-3">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[11px] text-[var(--color-muted)]"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="mt-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((cell, i) => {
              if (!cell.date || cell.dayOfMonth == null) {
                return (
                  <div
                    key={`empty-${weekIndex}-${i}`}
                    className="flex h-10 items-center justify-center"
                  />
                );
              }

              if (cell.isFuture) {
                return (
                  <div
                    key={cell.date}
                    className="flex h-10 items-center justify-center"
                  >
                    <span className="text-sm text-[var(--color-line)]">-</span>
                  </div>
                );
              }

              return (
                <div
                  key={cell.date}
                  className={`flex h-10 items-center justify-center rounded-md ${
                    cell.isToday ? "bg-[var(--color-accent-soft)]" : ""
                  }`}
                >
                  <span
                    className="text-[17px] font-bold leading-none"
                    style={{ color: ratingCssVar(cell.rating) }}
                  >
                    {studyRatingLabel(cell.rating)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
