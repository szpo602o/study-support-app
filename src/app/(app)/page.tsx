import { BigGoalCard } from "@/components/big-goal-card";
import { TodayRecordCard } from "@/components/today-record-card";
import { WeekProgressCard } from "@/components/week-progress-card";
import { WeeklyGoalsCard } from "@/components/weekly-goals-card";
import { formatJaDate, formatJaMonthDay, todayDateString } from "@/lib/dates";
import { gradeFromDailyAverageMinutes } from "@/lib/letter-grade";
import {
  averageDailyMinutesThroughToday,
  buildExamScoreboard,
  ensureStudyLogsBackfilled,
  getCurrentWeekContext,
  getStudyLogForDate,
  listActiveGoals,
  listExamScores,
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
  const examRows = await listExamScores(user.id);
  const board = buildExamScoreboard(
    examRows.map((r) => ({
      year: r.year,
      subject: r.subject,
      score: r.score,
    })),
  );

  const avgMinutes = averageDailyMinutesThroughToday(week.dayRatings, today);
  const habitGrade = gradeFromDailyAverageMinutes(avgMinutes);
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

      <WeekProgressCard
        rangeLabel={rangeLabel}
        days={week.dayRatings}
        todayDate={today}
        habitGrade={habitGrade}
        avgMinutes={avgMinutes}
        abilityGrade={board.latest?.grade ?? null}
        abilityAverage={board.latest?.average ?? null}
      />

      <div id="today-record" className="scroll-mt-4">
        <TodayRecordCard
          logDate={today}
          dateLabel={formatJaDate(today)}
          initialMinutes={todayLog?.studyMinutes ?? null}
        />
      </div>
    </div>
  );
}
