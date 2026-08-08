"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  incompleteTaskReviews,
  weekReviews,
  weeks,
  weeklyPlanSnapshots,
  weeklyTasks,
} from "@/db/schema";
import { addDaysToDateString } from "@/lib/dates";
import {
  estimateMinutes,
  type EstimateCode,
  type IncompleteDisposition,
  type IncompleteReason,
  type TimeBucket,
  timeBucketApproxMinutes,
} from "@/lib/labels";
import {
  assertWeekOpen,
  getOrCreateCurrentWeek,
  getWeekBundle,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export async function lockWeekReview(input: {
  incomplete: {
    taskId: string;
    reason: IncompleteReason;
    disposition: IncompleteDisposition;
  }[];
  nextWeekTasks: {
    title: string;
    goalId: string;
    estimatedMinutesCode: EstimateCode;
  }[];
}) {
  const user = await requireUser();
  const week = await getOrCreateCurrentWeek(user.id);
  await assertWeekOpen(week.id);

  const bundle = await getWeekBundle(week.id);
  if (!bundle) return { error: "週データがありません" };
  if (!bundle.snapshot) {
    return { error: "当初計画のスナップショットがありません" };
  }

  const initialTasks = bundle.tasks.filter((t) => t.origin === "initial");
  const midAdds = bundle.tasks.filter((t) => t.origin === "mid_week_add");
  const openTasks = bundle.tasks.filter((t) => t.status === "open");

  if (openTasks.length > 0) {
    const reviewedIds = new Set(input.incomplete.map((i) => i.taskId));
    for (const t of openTasks) {
      if (!reviewedIds.has(t.id)) {
        return { error: `未完了タスク「${t.title}」の処遇を選んでください` };
      }
    }
  }

  const summary = {
    initialTaskCount: initialTasks.length,
    initialDoneCount: initialTasks.filter((t) => t.status === "done").length,
    midWeekAddCount: midAdds.length,
    midWeekAddDoneCount: midAdds.filter((t) => t.status === "done").length,
    plannedMinutes: initialTasks.reduce(
      (sum, t) =>
        sum + estimateMinutes(t.estimatedMinutesCode as EstimateCode),
      0,
    ),
    donePlannedMinutes: initialTasks
      .filter((t) => t.status === "done")
      .reduce(
        (sum, t) =>
          sum + estimateMinutes(t.estimatedMinutesCode as EstimateCode),
        0,
      ),
    actualMinutesApprox: bundle.logs.reduce(
      (sum, l) =>
        sum + timeBucketApproxMinutes(l.timeBucket as TimeBucket),
      0,
    ),
    planChangeCount: bundle.changes.length,
  };

  const db = getDb();
  const [review] = await db
    .insert(weekReviews)
    .values({
      weekId: week.id,
      summaryJson: summary,
    })
    .returning();

  if (input.incomplete.length > 0) {
    await db.insert(incompleteTaskReviews).values(
      input.incomplete.map((row) => ({
        weekReviewId: review.id,
        weeklyTaskId: row.taskId,
        reason: row.reason,
        disposition: row.disposition,
      })),
    );

    for (const row of input.incomplete) {
      if (row.disposition === "drop") {
        await db
          .update(weeklyTasks)
          .set({ status: "dropped" })
          .where(eq(weeklyTasks.id, row.taskId));
      }
    }
  }

  await db
    .update(weeks)
    .set({ status: "reviewed", reviewedAt: new Date() })
    .where(eq(weeks.id, week.id));

  const recommitTasks = input.incomplete
    .filter((i) => i.disposition === "recommit")
    .flatMap((i) => {
      const task = openTasks.find((t) => t.id === i.taskId);
      if (!task) return [];
      return [
        {
          title: task.title,
          goalId: task.goalId,
          estimatedMinutesCode: task.estimatedMinutesCode as EstimateCode,
        },
      ];
    });

  const nextTasks = [...recommitTasks, ...input.nextWeekTasks];

  if (nextTasks.length > 0) {
    const nextStart = addDaysToDateString(week.endDate, 1);
    const nextEnd = addDaysToDateString(nextStart, 6);

    let [nextWeek] = await db
      .select()
      .from(weeks)
      .where(
        and(eq(weeks.userId, user.id), eq(weeks.startDate, nextStart)),
      )
      .limit(1);

    if (!nextWeek) {
      [nextWeek] = await db
        .insert(weeks)
        .values({
          userId: user.id,
          startDate: nextStart,
          endDate: nextEnd,
        })
        .returning();
    }

    const [existingSnap] = await db
      .select()
      .from(weeklyPlanSnapshots)
      .where(eq(weeklyPlanSnapshots.weekId, nextWeek.id))
      .limit(1);

    if (!existingSnap) {
      const inserted = await db
        .insert(weeklyTasks)
        .values(
          nextTasks.map((t) => ({
            weekId: nextWeek.id,
            goalId: t.goalId,
            title: t.title,
            estimatedMinutesCode: t.estimatedMinutesCode,
            origin: "initial" as const,
          })),
        )
        .returning();

      await db.insert(weeklyPlanSnapshots).values({
        weekId: nextWeek.id,
        snapshotJson: {
          tasks: inserted.map((t) => ({
            id: t.id,
            title: t.title,
            goalId: t.goalId,
            estimatedMinutesCode: t.estimatedMinutesCode,
            origin: t.origin,
          })),
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/review");
  revalidatePath("/history");
  revalidatePath("/daily");

  return { ok: true, summary };
}
