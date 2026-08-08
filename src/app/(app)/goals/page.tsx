import {
  addRoadmapItem,
  archiveGoal,
  createGoal,
  recordExamResult,
  setActiveMilestone,
} from "@/actions/goals";
import { addDaysToDateString, formatJaDate, todayDateString } from "@/lib/dates";
import { getGoalBundle, listActiveGoals } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import { goals } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const active = await listActiveGoals(user.id);
  const bundles = await Promise.all(active.map((g) => getGoalBundle(g.id)));
  const db = getDb();
  const archived = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, user.id), eq(goals.status, "archived")));

  const maxDue = addDaysToDateString(todayDateString(), 14);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">目標設定</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          アクティブ最大2。削除はできません。終わったら結果を残してアーカイブ。
        </p>
      </div>

      {active.length < 2 && (
        <section className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <h2 className="text-xl">新しい目標</h2>
          <form action={createGoal} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="title"
              required
              placeholder="例: 中小企業診断士一次合格"
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base sm:col-span-2"
            />
            <label className="text-sm text-[var(--muted)]">
              試験日
              <input
                type="date"
                name="examDate"
                required
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--ink)] px-4 py-2 text-[var(--paper)]"
              >
                追加
              </button>
            </div>
          </form>
        </section>
      )}

      {bundles.map((bundle) => {
        if (!bundle) return null;
        const { goal, roadmap, milestone } = bundle;
        return (
          <section
            key={goal.id}
            className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--paper)]/90 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl">{goal.title}</h2>
                <p className="text-sm text-[var(--muted)]">
                  試験日 {formatJaDate(goal.examDate)}
                </p>
              </div>
              <form action={archiveGoal.bind(null, goal.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)]"
                >
                  アーカイブ（結果なし）
                </button>
              </form>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg">ロードマップ</h3>
              <ol className="space-y-2">
                {roadmap.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {item.sortOrder}. {item.title}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        目標日 {formatJaDate(item.targetDate)}
                        {item.originalTargetDate !== item.targetDate &&
                          `（当初 ${formatJaDate(item.originalTargetDate)}）`}
                        · {item.status}
                      </p>
                    </div>
                    <form
                      action={setActiveMilestone}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="goalId" value={goal.id} />
                      <input
                        type="hidden"
                        name="roadmapItemId"
                        value={item.id}
                      />
                      <label className="text-xs text-[var(--muted)]">
                        中間期限
                        <input
                          type="date"
                          name="dueDate"
                          required
                          max={maxDue}
                          defaultValue={maxDue}
                          className="mt-1 block rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-base"
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
                      >
                        フォーカスにする
                      </button>
                    </form>
                  </li>
                ))}
              </ol>

              {roadmap.length < 10 && (
                <form
                  action={addRoadmapItem}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-dashed border-[var(--line)] p-3 sm:grid-cols-3"
                >
                  <input type="hidden" name="goalId" value={goal.id} />
                  <input
                    type="hidden"
                    name="sortOrder"
                    value={roadmap.length + 1}
                  />
                  <input
                    name="title"
                    required
                    placeholder="段階名"
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base sm:col-span-2"
                  />
                  <input
                    type="date"
                    name="targetDate"
                    required
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--line)] px-3 py-2 text-sm sm:col-span-3"
                  >
                    段階を追加
                  </button>
                </form>
              )}
            </div>

            {milestone && (
              <p className="text-sm">
                現在の中間目標: ロードマップ項目 · 期限{" "}
                {formatJaDate(milestone.dueDate)} · {milestone.status}
              </p>
            )}

            <form
              action={recordExamResult}
              className="grid grid-cols-1 gap-2 border-t border-[var(--line)] pt-4 sm:grid-cols-4"
            >
              <input type="hidden" name="goalId" value={goal.id} />
              <p className="text-sm font-medium sm:col-span-4">試験結果を記録</p>
              <select
                name="passed"
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
                defaultValue="true"
              >
                <option value="true">合格</option>
                <option value="false">不合格</option>
              </select>
              <input
                name="score"
                placeholder="点数（任意）"
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base"
              />
              <button
                type="submit"
                className="rounded-md bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)] sm:col-span-2"
              >
                結果を残してアーカイブ
              </button>
            </form>
          </section>
        );
      })}

      {archived.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">アーカイブ</h2>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {archived.map((g) => (
              <li key={g.id}>
                {g.title} · 試験日 {formatJaDate(g.examDate)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
