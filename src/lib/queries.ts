import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { addDays, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { getDb } from "@/db";
import {
  dailyLogTasks,
  dailyLogs,
  examScores,
  goals,
  milestones,
  planChanges,
  roadmapItems,
  studyLogs,
  weekReviews,
  weeks,
  weeklyGoals,
  weeklyPlanSnapshots,
  weeklyTasks,
} from "@/db/schema";
import { getWeekBounds, todayDateString } from "@/lib/dates";
import { EXAM_TYPE_SHINDANSHI_1ST } from "@/lib/exam-subjects";
import { gradeFromExamAverage, type LetterGrade } from "@/lib/letter-grade";
import { timeBucketApproxMinutes, type TimeBucket } from "@/lib/labels";
import {
  getStudyRating,
  isCircleOrAbove,
  isStudiedDay,
  type StudyRating,
} from "@/lib/study-rating";

export async function listActiveGoals(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
    .orderBy(asc(goals.examDate));
}

export async function listUserGoals(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.examDate));
}

/** 旧 daily_logs バケットから study_logs へ一度だけ近似バックフィル */
export async function ensureStudyLogsBackfilled(userId: string) {
  const db = getDb();
  const existing = await db
    .select({ id: studyLogs.id })
    .from(studyLogs)
    .where(eq(studyLogs.userId, userId))
    .limit(1);

  if (existing[0]) return;

  const userWeeks = await db
    .select()
    .from(weeks)
    .where(eq(weeks.userId, userId));

  if (userWeeks.length === 0) return;

  const weekIds = userWeeks.map((w) => w.id);
  const allLogs = await db.select().from(dailyLogs);

  const relevant = allLogs.filter((l) => weekIds.includes(l.weekId));
  if (relevant.length === 0) return;

  const now = new Date();
  for (const log of relevant) {
    const minutes = timeBucketApproxMinutes(log.timeBucket as TimeBucket);
    await db
      .insert(studyLogs)
      .values({
        userId,
        logDate: log.logDate,
        studyMinutes: minutes,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}

export async function getStudyLogForDate(userId: string, logDate: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(studyLogs)
    .where(and(eq(studyLogs.userId, userId), eq(studyLogs.logDate, logDate)))
    .limit(1);
  return row ?? null;
}

export async function listStudyLogsInRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const db = getDb();
  return db
    .select()
    .from(studyLogs)
    .where(
      and(
        eq(studyLogs.userId, userId),
        gte(studyLogs.logDate, startDate),
        lte(studyLogs.logDate, endDate),
      ),
    )
    .orderBy(asc(studyLogs.logDate));
}

export async function listWeeklyGoalsForWeek(userId: string, weekStart: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: weeklyGoals.id,
      goalId: weeklyGoals.goalId,
      content: weeklyGoals.content,
      weekStart: weeklyGoals.weekStart,
      goalTitle: goals.title,
    })
    .from(weeklyGoals)
    .innerJoin(goals, eq(weeklyGoals.goalId, goals.id))
    .where(
      and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStart, weekStart)),
    )
    .orderBy(asc(goals.examDate));

  return rows;
}

/** 旧 weekly_tasks から今週目標が空のときフォールバック表示用 */
export async function listFallbackWeeklyTaskTitles(
  userId: string,
  weekStart: string,
) {
  const db = getDb();
  const [week] = await db
    .select()
    .from(weeks)
    .where(and(eq(weeks.userId, userId), eq(weeks.startDate, weekStart)))
    .limit(1);
  if (!week) return [];

  const tasks = await db
    .select({
      id: weeklyTasks.id,
      title: weeklyTasks.title,
      goalId: weeklyTasks.goalId,
      goalTitle: goals.title,
    })
    .from(weeklyTasks)
    .innerJoin(goals, eq(weeklyTasks.goalId, goals.id))
    .where(eq(weeklyTasks.weekId, week.id))
    .orderBy(asc(weeklyTasks.createdAt))
    .limit(2);

  return tasks;
}

export type DayRating = {
  date: string;
  minutes: number | null;
  rating: StudyRating;
};

export function buildWeekDayRatings(
  weekStart: string,
  logs: { logDate: string; studyMinutes: number }[],
): DayRating[] {
  const byDate = new Map(logs.map((l) => [l.logDate, l.studyMinutes]));
  const days: DayRating[] = [];
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(parseISO(weekStart), i), "yyyy-MM-dd");
    const minutes = byDate.has(date) ? (byDate.get(date) as number) : null;
    days.push({
      date,
      minutes,
      rating: getStudyRating(minutes),
    });
  }
  return days;
}

export function summarizeRatings(days: DayRating[]) {
  const counts = {
    doubleCircle: 0,
    circle: 0,
    triangle: 0,
    x: 0,
    unrecorded: 0,
  };
  let totalMinutes = 0;
  let recorded = 0;
  let circleOrAbove = 0;

  for (const day of days) {
    counts[day.rating] += 1;
    if (day.minutes !== null) {
      recorded += 1;
      totalMinutes += day.minutes;
      if (isCircleOrAbove(day.rating)) circleOrAbove += 1;
    }
  }

  const circleOrAboveRate =
    recorded === 0 ? null : Math.round((circleOrAbove / recorded) * 100);

  return { counts, totalMinutes, recorded, circleOrAbove, circleOrAboveRate };
}

/**
 * 今週の1日平均（分）。月曜〜今日のうち、入力済みの日だけを平均する。
 * 未入力は分母・分子に含めない。記録が1日もなければ null。
 */
export function averageDailyMinutesThroughToday(
  days: DayRating[],
  today: string,
): number | null {
  const recorded = days.filter(
    (d) => d.date <= today && d.minutes !== null,
  );
  if (recorded.length === 0) return null;
  const total = recorded.reduce((sum, d) => sum + (d.minutes as number), 0);
  return total / recorded.length;
}

export async function getCurrentWeekContext(userId: string) {
  await ensureStudyLogsBackfilled(userId);
  const bounds = getWeekBounds();
  const logs = await listStudyLogsInRange(
    userId,
    bounds.startDate,
    bounds.endDate,
  );
  const dayRatings = buildWeekDayRatings(
    bounds.startDate,
    logs.map((l) => ({ logDate: l.logDate, studyMinutes: l.studyMinutes })),
  );
  const summary = summarizeRatings(dayRatings);
  let weeklyGoalRows = await listWeeklyGoalsForWeek(userId, bounds.startDate);
  let fromFallback = false;

  if (weeklyGoalRows.length === 0) {
    const fallback = await listFallbackWeeklyTaskTitles(
      userId,
      bounds.startDate,
    );
    if (fallback.length > 0) {
      fromFallback = true;
      weeklyGoalRows = fallback.map((t) => ({
        id: t.id,
        goalId: t.goalId,
        content: t.title,
        weekStart: bounds.startDate,
        goalTitle: t.goalTitle,
      }));
    }
  }

  return {
    bounds,
    dayRatings,
    summary,
    weeklyGoals: weeklyGoalRows,
    fromFallback,
  };
}

export async function getReflectContext(
  userId: string,
  monthKey?: string,
) {
  await ensureStudyLogsBackfilled(userId);
  const db = getDb();
  const allLogs = await db
    .select()
    .from(studyLogs)
    .where(eq(studyLogs.userId, userId))
    .orderBy(asc(studyLogs.logDate));

  const today = todayDateString();
  const todayDate = parseISO(today);

  let focusMonth = startOfMonth(todayDate);
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    const parsed = parseISO(`${monthKey}-01`);
    if (!Number.isNaN(parsed.getTime())) {
      focusMonth = startOfMonth(parsed);
    }
  }

  // 未来月は今月までに制限
  if (focusMonth > startOfMonth(todayDate)) {
    focusMonth = startOfMonth(todayDate);
  }

  const monthStart = format(focusMonth, "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(focusMonth), "yyyy-MM-dd");
  const byDate = new Map(allLogs.map((l) => [l.logDate, l.studyMinutes]));

  const monthStartDate = parseISO(monthStart);
  const monthEndDate = parseISO(monthEnd);
  // 月曜始まり（アプリ全体と最近4週間と揃える）
  const padStart = (monthStartDate.getDay() + 6) % 7;

  const cells: {
    date: string | null;
    dayOfMonth: number | null;
    minutes: number | null;
    rating: StudyRating;
    isToday: boolean;
    isFuture: boolean;
  }[] = [];

  for (let i = 0; i < padStart; i++) {
    cells.push({
      date: null,
      dayOfMonth: null,
      minutes: null,
      rating: "unrecorded",
      isToday: false,
      isFuture: false,
    });
  }

  let cursor = monthStartDate;
  while (cursor <= monthEndDate) {
    const date = format(cursor, "yyyy-MM-dd");
    const hasLog = byDate.has(date);
    const minutes = hasLog ? (byDate.get(date) as number) : null;
    cells.push({
      date,
      dayOfMonth: cursor.getDate(),
      minutes,
      rating: getStudyRating(minutes),
      isToday: date === today,
      isFuture: date > today,
    });
    cursor = addDays(cursor, 1);
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      dayOfMonth: null,
      minutes: null,
      rating: "unrecorded",
      isToday: false,
      isFuture: false,
    });
  }

  const monthDays: DayRating[] = [];
  cursor = monthStartDate;
  while (cursor <= monthEndDate) {
    const date = format(cursor, "yyyy-MM-dd");
    if (date <= today) {
      const minutes = byDate.has(date) ? (byDate.get(date) as number) : null;
      monthDays.push({ date, minutes, rating: getStudyRating(minutes) });
    }
    cursor = addDays(cursor, 1);
  }

  const monthSummary = summarizeRatings(monthDays);

  let currentStreak = 0;
  let checkDate = today;
  for (;;) {
    const minutes = byDate.has(checkDate)
      ? (byDate.get(checkDate) as number)
      : null;
    if (!isStudiedDay(minutes)) break;
    currentStreak += 1;
    checkDate = format(addDays(parseISO(checkDate), -1), "yyyy-MM-dd");
  }

  // 最近4週間（月曜始まり・今日基準）
  const thisWeekStart = getWeekBounds(todayDate).startDate;
  const recentWeeks: {
    weekStart: string;
    weekEnd: string;
    label: string;
    days: DayRating[];
  }[] = [];

  for (let w = 0; w < 4; w++) {
    const weekStart = format(
      addDays(parseISO(thisWeekStart), -7 * w),
      "yyyy-MM-dd",
    );
    const weekEnd = format(addDays(parseISO(weekStart), 6), "yyyy-MM-dd");
    const days = buildWeekDayRatings(
      weekStart,
      allLogs.map((l) => ({
        logDate: l.logDate,
        studyMinutes: l.studyMinutes,
      })),
    );
    recentWeeks.push({
      weekStart,
      weekEnd,
      label: `${format(parseISO(weekStart), "M/d")}〜${format(parseISO(weekEnd), "M/d")}`,
      days,
    });
  }

  const prevMonth = format(addDays(focusMonth, -1), "yyyy-MM");
  const nextMonthDate = startOfMonth(addDays(endOfMonth(focusMonth), 1));
  const canGoNext = nextMonthDate <= startOfMonth(todayDate);
  const nextMonth = canGoNext ? format(nextMonthDate, "yyyy-MM") : null;

  return {
    monthKey: format(focusMonth, "yyyy-MM"),
    monthYearLabel: format(focusMonth, "yyyy年M月"),
    prevMonthKey: prevMonth,
    nextMonthKey: nextMonth,
    cells,
    monthSummary,
    monthTotalMinutes: monthSummary.totalMinutes,
    unrecordedCount: monthSummary.counts.unrecorded,
    currentStreak,
    recentWeeks,
    today,
  };
}

// --- 旧クエリ互換（旧ページ・actions用） ---

export async function assertWeekOpen(weekId: string) {
  const db = getDb();
  const [week] = await db
    .select()
    .from(weeks)
    .where(eq(weeks.id, weekId))
    .limit(1);
  if (!week) throw new Error("週が見つかりません");
  if (week.status === "reviewed") {
    throw new Error("確定済みの週は編集できません");
  }
  return week;
}

export async function getOrCreateCurrentWeek(userId: string) {
  const db = getDb();
  const bounds = getWeekBounds();
  const existing = await db
    .select()
    .from(weeks)
    .where(
      and(eq(weeks.userId, userId), eq(weeks.startDate, bounds.startDate)),
    )
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(weeks)
    .values({
      userId,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
    })
    .returning();
  return created;
}

export async function getGoalBundle(goalId: string) {
  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal) return null;

  const roadmap = await db
    .select()
    .from(roadmapItems)
    .where(eq(roadmapItems.goalId, goalId))
    .orderBy(asc(roadmapItems.sortOrder));

  const activeMilestones = await db
    .select()
    .from(milestones)
    .where(
      and(eq(milestones.goalId, goalId), eq(milestones.status, "active")),
    )
    .limit(1);

  return {
    goal,
    roadmap,
    milestone: activeMilestones[0] ?? null,
  };
}

export async function getWeekBundle(weekId: string) {
  const db = getDb();
  const [week] = await db.select().from(weeks).where(eq(weeks.id, weekId));
  if (!week) return null;

  const tasks = await db
    .select()
    .from(weeklyTasks)
    .where(eq(weeklyTasks.weekId, weekId))
    .orderBy(asc(weeklyTasks.createdAt));

  const [snapshot] = await db
    .select()
    .from(weeklyPlanSnapshots)
    .where(eq(weeklyPlanSnapshots.weekId, weekId))
    .limit(1);

  const changes = await db
    .select()
    .from(planChanges)
    .where(eq(planChanges.weekId, weekId))
    .orderBy(asc(planChanges.createdAt));

  const logs = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.weekId, weekId))
    .orderBy(asc(dailyLogs.logDate));

  const logIds = logs.map((l) => l.id);
  const logTasks =
    logIds.length === 0
      ? []
      : await db
          .select()
          .from(dailyLogTasks)
          .where(inArray(dailyLogTasks.dailyLogId, logIds));

  const [review] = await db
    .select()
    .from(weekReviews)
    .where(eq(weekReviews.weekId, weekId))
    .limit(1);

  return { week, tasks, snapshot, changes, logs, logTasks, review };
}

export async function listWeekHistory(userId: string) {
  const db = getDb();
  const weekRows = await db
    .select()
    .from(weeks)
    .where(eq(weeks.userId, userId))
    .orderBy(desc(weeks.startDate));

  const reviewRows = await db.select().from(weekReviews);
  const reviewByWeek = new Map(reviewRows.map((r) => [r.weekId, r]));

  return weekRows.map((week) => ({
    week,
    review: reviewByWeek.get(week.id) ?? null,
  }));
}

export function isLateEntry(logDate: string) {
  return todayDateString() > logDate;
}

export async function listExamScores(
  userId: string,
  examType: string = EXAM_TYPE_SHINDANSHI_1ST,
) {
  const db = getDb();
  return db
    .select()
    .from(examScores)
    .where(
      and(eq(examScores.userId, userId), eq(examScores.examType, examType)),
    )
    .orderBy(desc(examScores.year), asc(examScores.subject));
}

export type ExamYearSummary = {
  year: number;
  scoresBySubject: Record<string, number>;
  average: number | null;
  grade: LetterGrade | null;
  belowCutoff: { subject: string; score: number }[];
};

export function buildExamScoreboard(
  rows: { year: number; subject: string; score: number }[],
): {
  years: number[];
  byYear: ExamYearSummary[];
  latest: ExamYearSummary | null;
} {
  const yearSet = new Set<number>();
  const map = new Map<number, Record<string, number>>();

  for (const row of rows) {
    yearSet.add(row.year);
    const bucket = map.get(row.year) ?? {};
    bucket[row.subject] = row.score;
    map.set(row.year, bucket);
  }

  const years = [...yearSet].sort((a, b) => b - a);
  const byYear: ExamYearSummary[] = years.map((year) => {
    const scoresBySubject = map.get(year) ?? {};
    const values = Object.values(scoresBySubject);
    const average =
      values.length === 0
        ? null
        : Math.round((values.reduce((s, n) => s + n, 0) / values.length) * 10) /
          10;
    const grade = average === null ? null : gradeFromExamAverage(average);
    const belowCutoff = Object.entries(scoresBySubject)
      .filter(([, score]) => score < 40)
      .map(([subject, score]) => ({ subject, score }))
      .sort((a, b) => a.score - b.score);

    return { year, scoresBySubject, average, grade, belowCutoff };
  });

  return {
    years,
    byYear,
    latest: byYear[0] ?? null,
  };
}
