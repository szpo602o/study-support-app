import { DailyForm } from "@/components/daily-form";
import { formatJaDate, todayDateString, weekLabel } from "@/lib/dates";
import type { TimeBucket } from "@/lib/labels";
import {
  getOrCreateCurrentWeek,
  getWeekBundle,
  listActiveGoals,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const user = await requireUser();
  const goals = await listActiveGoals(user.id);
  const week = await getOrCreateCurrentWeek(user.id);
  const bundle = await getWeekBundle(week.id);
  const today = todayDateString();
  const todayLog = bundle?.logs.find((l) => l.logDate === today);
  const todayLogTasks =
    bundle?.logTasks.filter((lt) => lt.dailyLogId === todayLog?.id) ?? [];

  const tasks =
    bundle?.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      origin: t.origin,
      goalTitle: goals.find((g) => g.id === t.goalId)?.title ?? "",
    })) ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-sm text-[var(--muted)]">
          {weekLabel(week.startDate)} · {formatJaDate(today)}
          {todayLog?.isLateEntry ? " · 後日入力" : ""}
        </p>
        <h1 className="text-3xl">日次入力</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          目標1分。時間区分を選び、取り組んだタスクだけ触る。
        </p>
      </div>

      {!bundle?.snapshot ? (
        <p className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          先に今週の当初計画をホームでコミットしてください。
        </p>
      ) : (
        <DailyForm
          logDate={today}
          initialBucket={(todayLog?.timeBucket as TimeBucket) ?? null}
          tasks={tasks}
          initialWorked={todayLogTasks
            .filter((t) => t.worked)
            .map((t) => t.weeklyTaskId)}
          initialCompleted={todayLogTasks
            .filter((t) => t.completed)
            .map((t) => t.weeklyTaskId)}
          locked={week.status === "reviewed"}
        />
      )}
    </div>
  );
}
