"use client";

import { useState, useTransition } from "react";
import { saveDailyLog } from "@/actions/daily";
import { TIME_BUCKETS, type TimeBucket } from "@/lib/labels";

type Task = {
  id: string;
  title: string;
  status: string;
  origin: string;
  goalTitle: string;
};

export function DailyForm({
  logDate,
  initialBucket,
  tasks,
  initialWorked,
  initialCompleted,
  locked,
}: {
  logDate: string;
  initialBucket: TimeBucket | null;
  tasks: Task[];
  initialWorked: string[];
  initialCompleted: string[];
  locked: boolean;
}) {
  const [bucket, setBucket] = useState<TimeBucket>(initialBucket ?? "0");
  const [worked, setWorked] = useState<Set<string>>(new Set(initialWorked));
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCompleted),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleWorked(id: string) {
    setWorked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCompleted((c) => {
          const nc = new Set(c);
          nc.delete(id);
          return nc;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleCompleted(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setWorked((w) => new Set(w).add(id));
      }
      return next;
    });
  }

  function onSubmit() {
    startTransition(async () => {
      const result = await saveDailyLog({
        logDate,
        timeBucket: bucket,
        workedTaskIds: bucket === "0" ? [] : [...worked],
        completedTaskIds: bucket === "0" ? [] : [...completed],
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        result.isLateEntry
          ? "保存しました（後日入力）"
          : "保存しました",
      );
    });
  }

  const openish = tasks.filter((t) => t.status !== "dropped");

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-[var(--muted)]">
          学習時間
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TIME_BUCKETS.map((b) => (
            <button
              key={b.value}
              type="button"
              disabled={locked}
              onClick={() => setBucket(b.value)}
              className={`min-h-12 rounded-lg border px-3 py-3 text-base transition ${
                bucket === b.value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                  : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--accent)]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {bucket !== "0" && (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-[var(--muted)]">
            取り組んだタスク
          </h2>
          <ul className="space-y-2">
            {openish.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted)]">{task.goalTitle}</p>
                    <p className="break-words font-medium text-[var(--ink)]">
                      {task.title}
                      {task.origin === "mid_week_add" && (
                        <span className="ml-2 text-xs text-[var(--warn)]">
                          途中追加
                        </span>
                      )}
                    </p>
                  </div>
                  {task.status === "done" && (
                    <span className="shrink-0 text-xs text-[var(--accent)]">完了済</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => toggleWorked(task.id)}
                    className={`rounded-md px-3 py-2 text-sm ${
                      worked.has(task.id)
                        ? "bg-[var(--wash)] text-[var(--ink)] ring-1 ring-[var(--ink)]"
                        : "bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    取り組んだ
                  </button>
                  <button
                    type="button"
                    disabled={locked || task.status === "done"}
                    onClick={() => toggleCompleted(task.id)}
                    className={`rounded-md px-3 py-2 text-sm ${
                      completed.has(task.id) || task.status === "done"
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    完了
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!locked && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="w-full rounded-lg bg-[var(--ink)] px-4 py-3 text-base font-medium text-[var(--paper)] disabled:opacity-60"
        >
          {pending ? "保存中…" : "今日を記録する"}
        </button>
      )}

      {message && (
        <p className="text-center text-sm text-[var(--accent)]">{message}</p>
      )}
    </div>
  );
}
