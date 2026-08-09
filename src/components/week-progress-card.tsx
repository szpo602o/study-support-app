"use client";

import Link from "next/link";
import { useState } from "react";
import { StudyLogEditSheet } from "@/components/study-log-edit-sheet";
import { formatJaDate } from "@/lib/dates";
import {
  letterGradeCssVar,
  type LetterGrade,
} from "@/lib/letter-grade";
import {
  ratingCssVar,
  studyRatingLabel,
  type StudyRating,
} from "@/lib/study-rating";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

type Day = {
  date: string;
  minutes: number | null;
  rating: StudyRating;
};

function GradeStamp({ grade }: { grade: LetterGrade }) {
  return (
    <span
      className="grade-stamp grade-stamp--soft"
      style={{ color: letterGradeCssVar(grade) }}
    >
      <span className="grade-stamp-letter">{grade}</span>
      <span className="grade-stamp-label">判定</span>
    </span>
  );
}

export function WeekProgressCard({
  rangeLabel,
  days,
  todayDate,
  habitGrade,
  avgMinutes,
  abilityGrade,
  abilityAverage,
}: {
  rangeLabel: string;
  days: Day[];
  todayDate: string;
  habitGrade: LetterGrade;
  avgMinutes: number | null;
  abilityGrade: LetterGrade | null;
  abilityAverage: number | null;
}) {
  const [selected, setSelected] = useState<{
    date: string;
    minutes: number | null;
  } | null>(null);

  const avgLabel = avgMinutes === null ? null : Math.round(avgMinutes);

  return (
    <>
      <section id="week-progress" className="cork-card scroll-mt-4 p-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="section-title section-title-underline">今週の進捗</h2>
          <p className="inline-flex shrink-0 rounded-full bg-[color-mix(in_oklab,var(--color-accent-soft)_90%,white)] px-2 py-0.5 text-[11px] text-[var(--color-chalkboard)]">
            {rangeLabel}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/reflect"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-line)_80%,transparent)] bg-[color-mix(in_oklab,var(--color-surface)_88%,white)] px-2.5 py-2 transition-colors active:bg-[var(--color-accent-soft)]"
          >
            <p className="text-[10px] text-[var(--color-muted)]">学習習慣</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span
                className="grade-mark-xl text-xl tabular-nums"
                style={{ color: letterGradeCssVar(habitGrade) }}
              >
                {habitGrade}
              </span>
              <span className="text-[11px] text-[var(--color-muted)]">
                {avgLabel === null ? "記録なし" : `平均${avgLabel}分`}
              </span>
            </p>
          </Link>
          <Link
            href="/grades"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-line)_80%,transparent)] bg-[color-mix(in_oklab,var(--color-surface)_88%,white)] px-2.5 py-2 transition-colors active:bg-[var(--color-accent-soft)]"
          >
            <p className="text-[10px] text-[var(--color-muted)]">過去問実力</p>
            {abilityGrade && abilityAverage !== null ? (
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span
                  className="grade-mark-xl text-xl tabular-nums"
                  style={{ color: letterGradeCssVar(abilityGrade) }}
                >
                  {abilityGrade}
                </span>
                <span className="text-[11px] text-[var(--color-muted)]">
                  平均{abilityAverage}点
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">未入力</p>
            )}
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="relative min-w-[280px]">
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day, i) => {
                const isToday = day.date === todayDate;
                const isFuture = day.date > todayDate;
                if (isFuture) {
                  return (
                    <div key={day.date} className="day-slip opacity-55">
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {WEEKDAY_LABELS[i]}
                      </span>
                      <span
                        className="text-lg font-bold leading-none"
                        style={{ color: ratingCssVar(day.rating) }}
                      >
                        {studyRatingLabel(day.rating)}
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() =>
                      setSelected({ date: day.date, minutes: day.minutes })
                    }
                    className={`day-slip transition-colors active:bg-[var(--color-accent-soft)] ${
                      isToday
                        ? "ring-1 ring-[var(--color-chalkboard)] ring-offset-1 ring-offset-[var(--color-cork-bg)]"
                        : ""
                    }`}
                    aria-label={`${formatJaDate(day.date)}の記録を編集`}
                  >
                    <span
                      className={`text-[10px] ${
                        isToday
                          ? "font-semibold text-[var(--color-chalkboard)]"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {WEEKDAY_LABELS[i]}
                    </span>
                    <span
                      className="text-lg font-bold leading-none"
                      style={{ color: ratingCssVar(day.rating) }}
                    >
                      {studyRatingLabel(day.rating)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {avgLabel === null ? "記録なし" : `1日平均 ${avgLabel}分`}
          </p>
          <GradeStamp grade={habitGrade} />
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
        <p className="mt-2 text-[11px] text-[var(--color-muted)]">
          曜日をタップすると記録を追加・修正できます
        </p>
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
