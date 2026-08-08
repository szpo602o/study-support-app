import { ReviewForm } from "@/components/review-form";
import { formatJaDate, todayDateString, weekLabel } from "@/lib/dates";
import {
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
import { decideMilestone } from "@/actions/goals";
import { MILESTONE_DECISIONS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const goals = await listActiveGoals(user.id);
  const week = await getOrCreateCurrentWeek(user.id);
  const bundle = await getWeekBundle(week.id);
  const goalBundles = await Promise.all(
    goals.map(async (g) => getGoalBundle(g.id)),
  );
  const today = todayDateString();

  const tasks = bundle?.tasks ?? [];
  const initial = tasks.filter((t) => t.origin === "initial");
  const midAdds = tasks.filter((t) => t.origin === "mid_week_add");
  const openTasks = tasks.filter((t) => t.status === "open");

  const preview = {
    initialTaskCount: initial.length,
    initialDoneCount: initial.filter((t) => t.status === "done").length,
    midWeekAddCount: midAdds.length,
    plannedLabel: formatMinutes(
      initial.reduce(
        (s, t) => s + estimateMinutes(t.estimatedMinutesCode as EstimateCode),
        0,
      ),
    ),
    donePlannedLabel: formatMinutes(
      initial
        .filter((t) => t.status === "done")
        .reduce(
          (s, t) =>
            s + estimateMinutes(t.estimatedMinutesCode as EstimateCode),
          0,
        ),
    ),
    actualLabel: formatMinutes(
      (bundle?.logs ?? []).reduce(
        (s, l) =>
          s + timeBucketApproxMinutes(l.timeBucket as TimeBucket),
        0,
      ),
    ),
    planChangeCount: bundle?.changes.length ?? 0,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm text-[var(--muted)]">
          {weekLabel(week.startDate)} · {formatJaDate(week.startDate)}〜
          {formatJaDate(week.endDate)}
        </p>
        <h1 className="text-3xl">週次レビュー</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          日曜夜・10分以内。確定後はこの週を書き換えられません。
        </p>
      </div>

      {!bundle?.snapshot ? (
        <p className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          当初計画がまだありません。ホームでコミットしてください。
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-xl">D. 中間目標チェック</h2>
            {goalBundles.map((gb) => {
              if (!gb?.milestone) {
                return (
                  <p key={gb?.goal.id} className="text-sm text-[var(--muted)]">
                    {gb?.goal.title}: 中間目標なし
                  </p>
                );
              }
              const overdue = gb.milestone.dueDate < today;
              return (
                <div
                  key={gb.milestone.id}
                  className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
                >
                  <p className="font-medium">{gb.goal.title}</p>
                  <p className="text-sm text-[var(--muted)]">
                    期限 {formatJaDate(gb.milestone.dueDate)}
                    {overdue && (
                      <span className="ml-2 text-[var(--danger)]">遅延中</span>
                    )}
                  </p>
                  {overdue && week.status === "open" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MILESTONE_DECISIONS.map((d) => (
                        <form
                          key={d.value}
                          action={async () => {
                            "use server";
                            await decideMilestone(gb.milestone!.id, d.value);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm"
                          >
                            {d.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <ReviewForm
            openTasks={openTasks}
            goals={goals}
            preview={preview}
            locked={week.status === "reviewed"}
          />
        </>
      )}
    </div>
  );
}
