"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { dailyLogTasks, dailyLogs, weeklyTasks } from "@/db/schema";
import { todayDateString } from "@/lib/dates";
import type { TimeBucket } from "@/lib/labels";
import {
  assertWeekOpen,
  getOrCreateCurrentWeek,
  isLateEntry,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export async function saveDailyLog(input: {
  logDate: string;
  timeBucket: TimeBucket;
  workedTaskIds: string[];
  completedTaskIds: string[];
}) {
  const user = await requireUser();
  const week = await getOrCreateCurrentWeek(user.id);
  await assertWeekOpen(week.id);

  if (input.logDate < week.startDate || input.logDate > week.endDate) {
    return { error: "当週以外の日付は入力できません" };
  }

  if (input.logDate > todayDateString()) {
    return { error: "未来の日付は入力できません" };
  }

  const db = getDb();
  const late = isLateEntry(input.logDate);

  const existing = await db
    .select()
    .from(dailyLogs)
    .where(
      and(eq(dailyLogs.weekId, week.id), eq(dailyLogs.logDate, input.logDate)),
    )
    .limit(1);

  let logId: string;
  if (existing[0]) {
    logId = existing[0].id;
    await db
      .update(dailyLogs)
      .set({
        timeBucket: input.timeBucket,
        enteredAt: new Date(),
        isLateEntry: late,
      })
      .where(eq(dailyLogs.id, logId));
    await db
      .delete(dailyLogTasks)
      .where(eq(dailyLogTasks.dailyLogId, logId));
  } else {
    const [created] = await db
      .insert(dailyLogs)
      .values({
        weekId: week.id,
        logDate: input.logDate,
        timeBucket: input.timeBucket,
        isLateEntry: late,
      })
      .returning();
    logId = created.id;
  }

  const worked = new Set(input.workedTaskIds);
  const completed = new Set(input.completedTaskIds);

  if (input.timeBucket !== "0" && worked.size > 0) {
    await db.insert(dailyLogTasks).values(
      [...worked].map((taskId) => ({
        dailyLogId: logId,
        weeklyTaskId: taskId,
        worked: true,
        completed: completed.has(taskId),
      })),
    );
  }

  for (const taskId of completed) {
    await db
      .update(weeklyTasks)
      .set({ status: "done", completedAt: new Date() })
      .where(
        and(eq(weeklyTasks.id, taskId), eq(weeklyTasks.weekId, week.id)),
      );
  }

  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/review");
  return { ok: true, isLateEntry: late };
}
