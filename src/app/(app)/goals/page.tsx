import {
  archiveGoal,
  createGoal,
  recordExamResult,
  updateGoal,
} from "@/actions/goals";
import { formatJaDate } from "@/lib/dates";
import { listActiveGoals } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import { examResults, goals } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const active = await listActiveGoals(user.id);
  const db = getDb();

  const others = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, user.id),
        inArray(goals.status, ["completed", "archived"]),
      ),
    )
    .orderBy(desc(goals.createdAt));

  const results = await db.select().from(examResults);
  const resultByGoal = new Map(results.map((r) => [r.goalId, r]));

  return (
    <div className="space-y-[var(--section-gap)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-[var(--color-ink)]">
            目標の管理
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            資格名・試験日のみ。アクティブは最大2つ。
          </p>
        </div>
        <Link
          href="/"
          className="min-h-10 shrink-0 text-sm text-[var(--color-accent)]"
        >
          戻る
        </Link>
      </div>

      {active.length < 2 && (
        <section className="card space-y-3 p-[var(--card-pad)]">
          <h2 className="text-sm font-medium">新しい資格目標</h2>
          <form action={createGoal} className="space-y-3">
            <label className="block text-xs text-[var(--color-muted)]">
              名称
              <input
                name="title"
                required
                placeholder="例: 中小企業診断士試験1次"
                className="mt-1 h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base"
              />
            </label>
            <label className="block text-xs text-[var(--color-muted)]">
              試験日
              <input
                type="date"
                name="examDate"
                required
                className="mt-1 h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base"
              />
            </label>
            <button
              type="submit"
              className="h-12 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-medium text-white"
            >
              追加する
            </button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-ink)]">
          アクティブ
        </h2>
        {active.length === 0 ? (
          <div className="card p-[var(--card-pad)]">
            <p className="text-sm text-[var(--color-muted)]">
              アクティブな目標はありません
            </p>
          </div>
        ) : (
          active.map((goal) => (
            <article key={goal.id} className="card space-y-4 p-[var(--card-pad)]">
              <form action={updateGoal} className="space-y-3">
                <input type="hidden" name="goalId" value={goal.id} />
                <label className="block text-xs text-[var(--color-muted)]">
                  名称
                  <input
                    name="title"
                    required
                    defaultValue={goal.title}
                    className="mt-1 h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base"
                  />
                </label>
                <label className="block text-xs text-[var(--color-muted)]">
                  試験日
                  <input
                    type="date"
                    name="examDate"
                    required
                    defaultValue={goal.examDate}
                    className="mt-1 h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base"
                  />
                </label>
                <button
                  type="submit"
                  className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] text-sm font-medium"
                >
                  保存
                </button>
              </form>

              <details className="rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)] p-3">
                <summary className="cursor-pointer text-sm text-[var(--color-muted)]">
                  試験結果を登録して完了
                </summary>
                <form action={recordExamResult} className="mt-3 space-y-3">
                  <input type="hidden" name="goalId" value={goal.id} />
                  <label className="block text-xs text-[var(--color-muted)]">
                    結果
                    <select
                      name="passed"
                      className="mt-1 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm"
                    >
                      <option value="true">合格</option>
                      <option value="false">不合格</option>
                    </select>
                  </label>
                  <label className="block text-xs text-[var(--color-muted)]">
                    点数（任意）
                    <input
                      name="score"
                      inputMode="decimal"
                      className="mt-1 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-11 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-medium text-white"
                  >
                    完了にする
                  </button>
                </form>
              </details>

              <form action={archiveGoal.bind(null, goal.id)}>
                <button
                  type="submit"
                  className="w-full py-2 text-sm text-[var(--color-muted)]"
                >
                  結果なしでアーカイブ
                </button>
              </form>
            </article>
          ))
        )}
      </section>

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--color-ink)]">
            完了・アーカイブ
          </h2>
          {others.map((goal) => {
            const result = resultByGoal.get(goal.id);
            return (
              <article
                key={goal.id}
                className="card p-[var(--card-pad)] text-sm"
              >
                <p className="font-medium text-[var(--color-ink)]">
                  {goal.title}
                </p>
                <p className="mt-1 text-[var(--color-muted)]">
                  試験日 {formatJaDate(goal.examDate)} · {goal.status}
                </p>
                {result && (
                  <p className="mt-1 text-[var(--color-muted)]">
                    {result.passed ? "合格" : "不合格"}
                    {result.score != null ? ` · ${result.score}` : ""}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
