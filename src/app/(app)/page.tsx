import { BigGoalCard } from "@/components/big-goal-card";
import { TodayRecordCard } from "@/components/today-record-card";
import { WeekProgressCard } from "@/components/week-progress-card";
import { WeeklyGoalsCard } from "@/components/weekly-goals-card";
import { formatJaDate, formatJaMonthDay, todayDateString } from "@/lib/dates";
import {
  ensureStudyLogsBackfilled,
  getCurrentWeekContext,
  getStudyLogForDate,
  listActiveGoals,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUser();
  await ensureStudyLogsBackfilled(user.id);

  const today = todayDateString();
  const activeGoals = await listActiveGoals(user.id);
  const week = await getCurrentWeekContext(user.id);
  const todayLog = await getStudyLogForDate(user.id, today);

  const rangeLabel = `${formatJaMonthDay(week.bounds.startDate)}〜${formatJaMonthDay(week.bounds.endDate)}`;

  return (
    <div className="space-y-[var(--section-gap)]">
      <BigGoalCard goals={activeGoals} />

      <WeeklyGoalsCard
        goals={activeGoals.map((g) => ({ id: g.id, title: g.title }))}
        initial={week.weeklyGoals.map((g) => ({
          goalId: g.goalId,
          content: g.content,
          goalTitle: g.goalTitle,
        }))}
        fromFallback={week.fromFallback}
        compactEdit
      />

      <div id="today-record" className="scroll-mt-4">
        <TodayRecordCard
          logDate={today}
          dateLabel={formatJaDate(today)}
          initialMinutes={todayLog?.studyMinutes ?? null}
        />
      </div>

      <WeekProgressCard
        rangeLabel={rangeLabel}
        days={week.dayRatings}
        weeklyGoals={week.weeklyGoals.map((g) => ({ content: g.content }))}
        todayDate={today}
      />
    </div>
  );
}
