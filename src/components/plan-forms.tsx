"use client";

import { useState, useTransition } from "react";
import { commitInitialPlan, addMidWeekTask } from "@/actions/weeks";
import { ESTIMATE_CODES, type EstimateCode } from "@/lib/labels";

type Goal = { id: string; title: string };

type Draft = {
  title: string;
  goalId: string;
  estimatedMinutesCode: EstimateCode;
};

export function InitialPlanForm({ goals }: { goals: Goal[] }) {
  const [rows, setRows] = useState<Draft[]>([
    {
      title: "",
      goalId: goals[0]?.id ?? "",
      estimatedMinutesCode: "60",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (goals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
        先に目標を登録してください。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        今週の当初計画（約5件）。コミット後はこの一覧は消えず、変更は差分として残ります。
      </p>
      {rows.map((row, index) => (
        <div
          key={index}
          className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
        >
          <input
            className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
            placeholder="タスク内容"
            value={row.title}
            onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, title: e.target.value };
              setRows(next);
            }}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
              value={row.goalId}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, goalId: e.target.value };
                setRows(next);
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
                const next = [...rows];
                next[index] = {
                  ...row,
                  estimatedMinutesCode: e.target.value as EstimateCode,
                };
                setRows(next);
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          onClick={() =>
            setRows([
              ...rows,
              {
                title: "",
                goalId: goals[0].id,
                estimatedMinutesCode: "60",
              },
            ])
          }
        >
          行を追加
        </button>
        <button
          type="button"
          disabled={pending}
          className="rounded-md bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-60"
          onClick={() => {
            startTransition(async () => {
              const result = await commitInitialPlan(rows);
              if (result.error) setError(result.error);
              else setError(null);
            });
          }}
        >
          {pending ? "確定中…" : "当初計画をコミット"}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export function MidWeekAddForm({ goals }: { goals: Goal[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (goals.length === 0) return null;

  return (
    <form
      className="space-y-3 rounded-lg border border-dashed border-[var(--warn)]/40 bg-[var(--paper)] p-3"
      action={(fd) => {
        startTransition(async () => {
          const result = await addMidWeekTask(fd);
          if (result.error) setError(result.error);
          else setError(null);
        });
      }}
    >
      <p className="text-sm font-medium text-[var(--warn)]">途中追加（当初達成率には含めない）</p>
      <input
        name="title"
        required
        placeholder="追加タスク"
        className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          name="goalId"
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
          defaultValue={goals[0].id}
        >
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <select
          name="estimatedMinutesCode"
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
          defaultValue="60"
        >
          {ESTIMATE_CODES.map((c) => (
            <option key={c.value} value={c.value}>
              想定 {c.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-[var(--warn)] px-3 py-2 text-sm text-[var(--warn)] disabled:opacity-60"
      >
        {pending ? "追加中…" : "途中追加する"}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </form>
  );
}
