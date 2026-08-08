import {
  ratingCssVar,
  studyRatingLabel,
  type StudyRating,
} from "@/lib/study-rating";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

type WeeklyGoal = {
  content: string;
};

type Day = {
  date: string;
  rating: StudyRating;
};

export function WeekProgressCard({
  rangeLabel,
  days,
  weeklyGoals,
  todayDate,
}: {
  rangeLabel: string;
  days: Day[];
  weeklyGoals: WeeklyGoal[];
  todayDate: string;
}) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">今週の進捗</h2>
        <p className="text-xs text-[var(--color-muted)]">{rangeLabel}</p>
      </div>

      {weeklyGoals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {weeklyGoals.slice(0, 2).map((g, i) => (
            <li
              key={`${g.content}-${i}`}
              className="flex items-center gap-2 text-xs text-[var(--color-muted)]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[10px] font-bold text-[var(--color-accent)]">
                {i + 1}
              </span>
              <span className="truncate">{g.content}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 overflow-x-auto">
        <div className="relative min-w-[280px]">
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const isToday = day.date === todayDate;
              return (
                <div
                  key={day.date}
                  className={`relative flex flex-col items-center gap-1.5 rounded-[var(--radius-sm)] py-2 ${
                    isToday ? "bg-[var(--color-accent-soft)]" : ""
                  }`}
                >
                  {isToday && (
                    <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-[var(--color-accent)]" />
                  )}
                  <span
                    className={`text-[11px] ${
                      isToday
                        ? "font-semibold text-[var(--color-accent)]"
                        : "text-[var(--color-muted)]"
                    }`}
                  >
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
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-muted)]">
        <li>
          <span className="font-bold text-[var(--color-status-excellent)]">
            ◎
          </span>{" "}
          90分以上
        </li>
        <li>
          <span className="font-bold text-[var(--color-status-good)]">○</span>{" "}
          60〜89分
        </li>
        <li>
          <span className="font-bold text-[var(--color-status-fair)]">△</span>{" "}
          1〜59分
        </li>
        <li>
          <span className="font-bold text-[var(--color-status-fail)]">×</span>{" "}
          0分
        </li>
        <li>
          <span className="font-bold text-[var(--color-status-empty)]">-</span>{" "}
          未入力
        </li>
      </ul>
    </section>
  );
}
