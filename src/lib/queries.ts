import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dailyLogs,
  dailyLogTasks,
  goals,
  milestones,
  planChanges,
  roadmapItems,
  weekReviews,
  weeks,
  weeklyPlanSnapshots,
  weeklyTasks,
} from "@/db/schema";
import { getWeekBounds, todayDateString } from "@/lib/dates";

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

export async function listActiveGoals(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
    .orderBy(asc(goals.examDate));
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
