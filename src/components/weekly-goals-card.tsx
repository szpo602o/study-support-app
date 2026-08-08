"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveWeeklyGoals } from "@/actions/weekly-goals";
import { IconBook, IconDoc } from "@/components/icons";

type GoalOption = { id: string; title: string };
type WeeklyGoalRow = {
  goalId: string;
  content: string;
  goalTitle: string;
};

export function WeeklyGoalsCard({
  goals,
  initial,
  fromFallback,
  compactEdit = false,
}: {
  goals: GoalOption[];
  initial: WeeklyGoalRow[];
  fromFallback?: boolean;
  compactEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<WeeklyGoalRow[]>(() => {
    if (initial.length > 0) return initial.slice(0, 2);
    return goals.slice(0, 2).map((g) => ({
      goalId: g.id,
      content: "",
      goalTitle: g.title,
    }));
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveWeeklyGoals(
        rows.map((r) => ({ goalId: r.goalId, content: r.content })),
      );
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  const displayRows = initial.length > 0 ? initial : [];

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">今週の目標</h2>
        {goals.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!editing) {
                setRows(
                  (initial.length > 0
                    ? initial
                    : goals.slice(0, 2).map((g) => ({
                        goalId: g.id,
                        content: "",
                        goalTitle: g.title,
                      }))
                  ).slice(0, 2),
                );
              }
              setEditing((v) => !v);
            }}
            className="min-h-9 px-1 text-xs font-medium text-[var(--color-accent)]"
          >
            {editing ? "キャンセル" : compactEdit ? "編集" : "編集"}
          </button>
        )}
      </div>

      {!editing && (
        <div className="mt-3 space-y-2.5">
          {displayRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              まだ今週の目標がありません
            </p>
          ) : (
            displayRows.map((row, i) => {
              const Icon = i % 2 === 0 ? IconBook : IconDoc;
              return (
                <div
                  key={`${row.goalId}-${i}`}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[var(--color-ink)]">
                      {row.content}
                    </p>
                    <p className="truncate text-[11px] text-[var(--color-muted)]">
                      {row.goalTitle}
                    </p>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                </div>
              );
            })
          )}
          {fromFallback && displayRows.length > 0 && (
            <p className="text-[11px] text-[var(--color-muted)]">
              ※ 以前の週タスクから表示。編集で保存できます。
            </p>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-4">
          {goals.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              先に資格目標を追加してください
            </p>
          ) : (
            rows.map((row, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-xs text-[var(--color-muted)]">
                  {index + 1} 対象の資格
                  <select
                    value={row.goalId}
                    onChange={(e) => {
                      const goalId = e.target.value;
                      const g = goals.find((x) => x.id === goalId);
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === index
                            ? {
                                ...r,
                                goalId,
                                goalTitle: g?.title ?? r.goalTitle,
                              }
                            : r,
                        ),
                      );
                    }}
                    className="mt-1 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm"
                  >
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-[var(--color-muted)]">
                  目標内容
                  <input
                    value={row.content}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, content: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="例: 経済学 過去問1年分"
                    className="mt-1 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm"
                  />
                </label>
              </div>
            ))
          )}

          {goals.length >= 2 && rows.length < 2 && (
            <button
              type="button"
              onClick={() => {
                const used = new Set(rows.map((r) => r.goalId));
                const next = goals.find((g) => !used.has(g.id)) ?? goals[0];
                setRows((prev) => [
                  ...prev,
                  {
                    goalId: next.id,
                    content: "",
                    goalTitle: next.title,
                  },
                ]);
              }}
              className="text-sm text-[var(--color-accent)]"
            >
              ＋ もう1件追加
            </button>
          )}

          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((prev) => prev.slice(0, 1))}
              className="block text-sm text-[var(--color-muted)]"
            >
              2件目を削除
            </button>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="h-12 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "保存中…" : "保存する"}
          </button>
          {error && (
            <p className="text-sm text-[var(--color-status-fail)]">{error}</p>
          )}
        </div>
      )}
    </section>
  );
}
