"use client";

import { useMemo, useState, useTransition } from "react";
import { lockWeekReview } from "@/actions/review";
import {
  ESTIMATE_CODES,
  INCOMPLETE_DISPOSITIONS,
  INCOMPLETE_REASONS,
  type EstimateCode,
  type IncompleteDisposition,
  type IncompleteReason,
} from "@/lib/labels";

type Goal = { id: string; title: string };
type Task = {
  id: string;
  title: string;
  status: string;
  origin: string;
  goalId: string;
  estimatedMinutesCode: string;
};

type SummaryPreview = {
  initialTaskCount: number;
  initialDoneCount: number;
  midWeekAddCount: number;
  plannedLabel: string;
  donePlannedLabel: string;
  actualLabel: string;
  planChangeCount: number;
};

export function ReviewForm({
  openTasks,
  goals,
  preview,
  locked,
}: {
  openTasks: Task[];
  goals: Goal[];
  preview: SummaryPreview;
  locked: boolean;
}) {
  const [incomplete, setIncomplete] = useState<
    Record<
      string,
      { reason: IncompleteReason; disposition: IncompleteDisposition }
    >
  >(() =>
    Object.fromEntries(
      openTasks.map((t) => [
        t.id,
        { reason: "no_time" as const, disposition: "recommit" as const },
      ]),
    ),
  );
  const [nextRows, setNextRows] = useState(
    Array.from({ length: Math.max(1, 5 - openTasks.length) }, () => ({
      title: "",
      goalId: goals[0]?.id ?? "",
      estimatedMinutesCode: "60" as EstimateCode,
    })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const recommitCount = useMemo(
    () =>
      Object.values(incomplete).filter((v) => v.disposition === "recommit")
        .length,
    [incomplete],
  );

  if (locked) {
    return (
      <p className="rounded-lg border border-[var(--line)] bg-[var(--wash)] p-4 text-sm text-[var(--muted)]">
        この週は確定済みです。内容は履歴から確認できます。
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          A. 結果（消さない）
        </h2>
        <ul className="space-y-1 text-sm text-[var(--ink)]">
          <li>
            当初 {preview.initialTaskCount} 件中 {preview.initialDoneCount} 件完了
          </li>
          <li>途中追加 {preview.midWeekAddCount} 件</li>
          <li>
            想定 {preview.plannedLabel} のうち完了タスクは{" "}
            {preview.donePlannedLabel}
          </li>
          <li>実績時間（概算）{preview.actualLabel}</li>
          <li>計画変更 {preview.planChangeCount} 件</li>
        </ul>
      </section>

      {openTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            B. 未完了タスク
          </h2>
          {openTasks.map((task) => (
            <div
              key={task.id}
              className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
            >
              <p className="font-medium">{task.title}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
                  value={incomplete[task.id]?.reason}
                  onChange={(e) =>
                    setIncomplete((prev) => ({
                      ...prev,
                      [task.id]: {
                        ...prev[task.id],
                        reason: e.target.value as IncompleteReason,
                      },
                    }))
                  }
                >
                  {INCOMPLETE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
                  value={incomplete[task.id]?.disposition}
                  onChange={(e) =>
                    setIncomplete((prev) => ({
                      ...prev,
                      [task.id]: {
                        ...prev[task.id],
                        disposition: e.target.value as IncompleteDisposition,
                      },
                    }))
                  }
                >
                  {INCOMPLETE_DISPOSITIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          C. 翌週計画
        </h2>
        <p className="text-sm text-[var(--muted)]">
          再コミット {recommitCount} 件が自動で含まれます。新規を追加してください。
        </p>
        {nextRows.map((row, index) => (
          <div
            key={index}
            className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
          >
            <input
              className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
              placeholder="新規タスク"
              value={row.title}
              onChange={(e) => {
                const next = [...nextRows];
                next[index] = { ...row, title: e.target.value };
                setNextRows(next);
              }}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
                value={row.goalId}
                onChange={(e) => {
                  const next = [...nextRows];
                  next[index] = { ...row, goalId: e.target.value };
                  setNextRows(next);
                }}
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
                value={row.estimatedMinutesCode}
                onChange={(e) => {
                  const next = [...nextRows];
                  next[index] = {
                    ...row,
                    estimatedMinutesCode: e.target.value as EstimateCode,
                  };
                  setNextRows(next);
                }}
              >
                {ESTIMATE_CODES.map((c) => (
                  <option key={c.value} value={c.value}>
                    想定 {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          onClick={() =>
            setNextRows([
              ...nextRows,
              {
                title: "",
                goalId: goals[0]?.id ?? "",
                estimatedMinutesCode: "60",
              },
            ])
          }
        >
          行を追加
        </button>
      </section>

      <button
        type="button"
        disabled={pending || goals.length === 0}
        className="w-full rounded-lg bg-[var(--danger)] px-4 py-3 text-base font-medium text-white disabled:opacity-60"
        onClick={() => {
          startTransition(async () => {
            const result = await lockWeekReview({
              incomplete: openTasks.map((t) => ({
                taskId: t.id,
                reason: incomplete[t.id].reason,
                disposition: incomplete[t.id].disposition,
              })),
              nextWeekTasks: nextRows
                .filter((r) => r.title.trim())
                .map((r) => ({
                  title: r.title.trim(),
                  goalId: r.goalId,
                  estimatedMinutesCode: r.estimatedMinutesCode,
                })),
            });
            if (result.error) setMessage(result.error);
            else
              setMessage(
                `週を確定しました（当初 ${result.summary?.initialDoneCount}/${result.summary?.initialTaskCount}）`,
              );
          });
        }}
      >
        {pending ? "確定中…" : "この週を確定してロック"}
      </button>
      {message && (
        <p className="text-center text-sm text-[var(--accent)]">{message}</p>
      )}
    </div>
  );
}
