import Link from "next/link";
import { InitialPlanForm, MidWeekAddForm } from "@/components/plan-forms";
import {
  daysUntil,
  formatJaDate,
  todayDateString,
  weekLabel,
} from "@/lib/dates";
import {
  ESTIMATE_CODES,
  estimateMinutes,
  formatMinutes,
  timeBucketApproxMinutes,
  type EstimateCode,
  type TimeBucket,
} from "@/lib/labels";
import {
  getGoalBundle,
  getOrCreateCurrentWeek,
  getWeekBundle,
  listActiveGoals,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  const activeGoals = await listActiveGoals(user.id);
  const week = await getOrCreateCurrentWeek(user.id);
  const bundle = await getWeekBundle(week.id);
  const goalBundles = await Promise.all(
    activeGoals.map(async (g) => getGoalBundle(g.id)),
  );

  const tasks = bundle?.tasks ?? [];
  const logs = bundle?.logs ?? [];
  const today = todayDateString();
  const todayLogged = logs.some((l) => l.logDate === today);

  const initial = tasks.filter((t) => t.origin === "initial");
  const initialDone = initial.filter((t) => t.status === "done").length;
  const plannedMinutes = initial.reduce(
    (s, t) => s + estimateMinutes(t.estimatedMinutesCode as EstimateCode),
    0,
  );
  const donePlanned = initial
    .filter((t) => t.status === "done")
    .reduce(
      (s, t) => s + estimateMinutes(t.estimatedMinutesCode as EstimateCode),
      0,
    );
  const actual = logs.reduce(
    (s, l) => s + timeBucketApproxMinutes(l.timeBucket as TimeBucket),
    0,
  );

  const unreviewed = week.status === "open" && !!bundle?.snapshot;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm tracking-wide text-[var(--muted)]">
          {weekLabel(week.startDate)} · {formatJaDate(week.startDate)}〜
          {formatJaDate(week.endDate)}
          {week.status === "reviewed" && " · 確定済"}
        </p>
        <h1 className="text-3xl text-[var(--ink)] sm:text-4xl">今週の一枚</h1>
        {!todayLogged && week.status === "open" && (
          <Link
            href="/daily"
            className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            今日の入力へ
          </Link>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {goalBundles.map((gb) => {
          if (!gb) return null;
          const days = daysUntil(gb.goal.examDate);
          return (
            <div
              key={gb.goal.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/80 p-4"
            >
              <p className="text-xs text-[var(--muted)]">
                試験まで {days} 日 · {formatJaDate(gb.goal.examDate)}
              </p>
              <h2 className="mt-1 text-xl text-[var(--ink)]">{gb.goal.title}</h2>
              {gb.milestone ? (
                <p className="mt-3 text-sm text-[var(--ink)]">
                  中間目標期限 {formatJaDate(gb.milestone.dueDate)}
                  {gb.milestone.dueDate < today && (
                    <span className="ml-2 text-[var(--danger)]">遅延中</span>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  中間目標未設定 ·{" "}
                  <Link href="/goals" className="underline">
                    設定する
                  </Link>
                </p>
              )}
            </div>
          );
        })}
        {activeGoals.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)] lg:col-span-2">
            目標がありません。{" "}
            <Link href="/goals" className="underline">
              目標設定へ
            </Link>
          </div>
        )}
      </section>

      {!bundle?.snapshot ? (
        <section className="space-y-3">
          <h2 className="text-2xl">当初計画を立てる</h2>
          <InitialPlanForm goals={activeGoals} />
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-2xl">今週の約束</h2>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/80 p-4 text-sm">
              <p>
                当初 {initial.length} 件中 {initialDone} 件完了
              </p>
              <p>
                想定 {formatMinutes(plannedMinutes)} のうち完了は{" "}
                {formatMinutes(donePlanned)} / 実績概算{" "}
                {formatMinutes(actual)}
              </p>
              <p>計画変更 {bundle.changes.length} 件</p>
            </div>
            <ul className="space-y-2">
              {tasks.map((task) => {
                const estimate = ESTIMATE_CODES.find(
                  (e) => e.value === task.estimatedMinutesCode,
                );
                const goal = activeGoals.find((g) => g.id === task.goalId);
                return (
                  <li
                    key={task.id}
                    className="flex flex-col gap-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--muted)]">
                        {goal?.title}
                        {task.origin === "mid_week_add" && " · 途中追加"}
                        {task.origin === "recommit" && " · 再コミット"}
                      </p>
                      <p className="break-words font-medium">{task.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-sm text-[var(--muted)]">
                      <span>{estimate?.label}</span>
                      <span
                        className={
                          task.status === "done"
                            ? "text-[var(--accent)]"
                            : task.status === "dropped"
                              ? "text-[var(--danger)]"
                              : ""
                        }
                      >
                        {task.status === "done"
                          ? "完了"
                          : task.status === "dropped"
                            ? "中止"
                            : "未完了"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {week.status === "open" && (
              <MidWeekAddForm goals={activeGoals} />
            )}
          </section>

          {unreviewed && (
            <section className="rounded-xl border border-[var(--warn)]/40 bg-[color-mix(in_oklab,var(--warn)_8%,var(--paper))] p-4">
              <p className="text-sm text-[var(--warn)]">
                週次レビューがまだです。日曜夜に確定してください。
              </p>
              <Link
                href="/review"
                className="mt-2 inline-block text-sm font-medium underline"
              >
                週次レビューへ
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
