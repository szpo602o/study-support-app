"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertExamScore } from "@/actions/exam-scores";
import {
  recentExamYears,
  SHINDANSHI_1ST_SUBJECTS,
  toReiwaLabel,
} from "@/lib/exam-subjects";

export function ExamScoreForm({
  defaultYear,
}: {
  defaultYear?: number;
}) {
  const years = recentExamYears();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [year, setYear] = useState(defaultYear ?? years[0]);
  const [subject, setSubject] = useState<string>(SHINDANSHI_1ST_SUBJECTS[0]);
  const [score, setScore] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const scoreNum = Number(score);
    startTransition(async () => {
      const result = await upsertExamScore({
        year,
        subject,
        score: scoreNum,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage("保存しました");
      setScore("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="report-card space-y-3 p-4">
      <h2 className="section-title section-title-underline">点数を記録</h2>
      <p className="text-xs text-[var(--color-muted)]">
        年度・科目・点数だけ入力できます。同じ年度・科目は上書きされます。
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <span className="text-xs text-[var(--color-muted)]">年度</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {toReiwaLabel(y)}（{y}）
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-[var(--color-muted)]">点数</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            required
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="0〜100"
            className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 text-sm tabular-nums"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-[var(--color-muted)]">科目</span>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 text-sm"
        >
          {SHINDANSHI_1ST_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="text-sm text-[var(--color-warn-soft)]">{error}</p>
      )}
      {message && (
        <p className="text-sm text-[var(--color-accent)]">{message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-chalkboard disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存する"}
      </button>
    </form>
  );
}
