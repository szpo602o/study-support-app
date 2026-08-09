"use client";

import { useState } from "react";
import { StudyLogEditSheet } from "@/components/study-log-edit-sheet";
import { formatJaDate } from "@/lib/dates";
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
  const [selected, setSelected] = useState<{
    date: string;
    minutes: number | null;
  } | null>(null);

  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <>
      <section className="notebook-card overflow-hidden p-3 pl-5">
        <p className="mb-2 px-1 text-[11px] text-[var(--color-muted)]">
          日付をタップすると、未入力の追加や記録の修正ができます
        </p>
        <div className="grid grid-cols-7 border-b border-[color-mix(in_oklab,var(--color-chalkboard)_15%,var(--color-line))]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1.5 text-center text-[11px] font-medium text-[var(--color-chalkboard)]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="mt-0.5">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7 border-b border-[color-mix(in_oklab,var(--color-line)_70%,transparent)] last:border-b-0"
            >
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
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() =>
                      setSelected({
                        date: cell.date as string,
                        minutes: cell.minutes,
                      })
                    }
                    className={`flex h-10 items-center justify-center rounded-md transition-colors active:bg-[var(--color-accent-soft)] ${
                      cell.isToday ? "bg-[var(--color-accent-soft)]" : ""
                    }`}
                    aria-label={`${formatJaDate(cell.date)}の記録を編集`}
                  >
                    <span
                      className="text-[17px] font-bold leading-none"
                      style={{ color: ratingCssVar(cell.rating) }}
                    >
                      {studyRatingLabel(cell.rating)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <StudyLogEditSheet
        open={selected !== null}
        logDate={selected?.date ?? ""}
        dateLabel={selected ? formatJaDate(selected.date) : ""}
        initialMinutes={selected?.minutes ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
