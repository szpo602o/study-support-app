"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  planChanges,
  weeklyPlanSnapshots,
  weeklyTasks,
} from "@/db/schema";
import type { EstimateCode } from "@/lib/labels";
import {
  assertWeekOpen,
  getOrCreateCurrentWeek,
  listActiveGoals,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

async function ensureSnapshot(weekId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(weeklyPlanSnapshots)
    .where(eq(weeklyPlanSnapshots.weekId, weekId))
    .limit(1);
  if (existing) return existing;

  const tasks = await db
    .select()
    .from(weeklyTasks)
    .where(
      and(eq(weeklyTasks.weekId, weekId), eq(weeklyTasks.origin, "initial")),
    );

  if (tasks.length === 0) return null;

  const [snap] = await db
    .insert(weeklyPlanSnapshots)
    .values({
      weekId,
      snapshotJson: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          goalId: t.goalId,
          estimatedMinutesCode: t.estimatedMinutesCode,
          origin: t.origin,
        })),
      },
    })
    .returning();
  return snap;
}

export async function commitInitialPlan(
  tasks: {
    title: string;
    goalId: string;
    estimatedMinutesCode: EstimateCode;
  }[],
) {
  const user = await requireUser();
  const week = await getOrCreateCurrentWeek(user.id);
  await assertWeekOpen(week.id);

  const db = getDb();
  const [existingSnap] = await db
    .select()
    .from(weeklyPlanSnapshots)
    .where(eq(weeklyPlanSnapshots.weekId, week.id))
    .limit(1);
  if (existingSnap) {
    return { error: "当初計画はすでに確定しています。途中追加を使ってください" };
  }

  const activeGoals = await listActiveGoals(user.id);
  const goalIds = new Set(activeGoals.map((g) => g.id));

  const cleaned = tasks
    .map((t) => ({
      title: t.title.trim(),
      goalId: t.goalId,
      estimatedMinutesCode: t.estimatedMinutesCode,
    }))
    .filter((t) => t.title && goalIds.has(t.goalId));

  if (cleaned.length === 0) {
    return { error: "タスクを1件以上入力してください" };
  }

  await db.insert(weeklyTasks).values(
    cleaned.map((t) => ({
      weekId: week.id,
      goalId: t.goalId,
      title: t.title,
      estimatedMinutesCode: t.estimatedMinutesCode,
      origin: "initial" as const,
    })),
  );

  await ensureSnapshot(week.id);

  revalidatePath("/");
  revalidatePath("/review");
  revalidatePath("/daily");
  return { ok: true };
}

export async function addMidWeekTask(formData: FormData) {
  const user = await requireUser();
  const week = await getOrCreateCurrentWeek(user.id);
  await assertWeekOpen(week.id);

  const title = String(formData.get("title") ?? "").trim();
  const goalId = String(formData.get("goalId") ?? "");
  const estimatedMinutesCode = String(
    formData.get("estimatedMinutesCode") ?? "60",
  ) as EstimateCode;

  if (!title || !goalId) {
    return { error: "必須項目が不足しています" };
  }

  const db = getDb();
  const [snap] = await db
    .select()
    .from(weeklyPlanSnapshots)
    .where(eq(weeklyPlanSnapshots.weekId, week.id))
    .limit(1);
  if (!snap) {
    return { error: "まず当初計画をコミットしてください" };
  }

  const [task] = await db
    .insert(weeklyTasks)
    .values({
      weekId: week.id,
      goalId,
      title,
      estimatedMinutesCode,
      origin: "mid_week_add",
    })
    .returning();

  await db.insert(planChanges).values({
    weekId: week.id,
    taskId: task.id,
    changeType: "add",
    beforeJson: null,
    afterJson: {
      title: task.title,
      estimatedMinutesCode: task.estimatedMinutesCode,
      origin: task.origin,
    },
  });

  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/review");
  return { ok: true };
}

export async function dropTask(taskId: string) {
  const user = await requireUser();
  const week = await getOrCreateCurrentWeek(user.id);
  await assertWeekOpen(week.id);

  const db = getDb();
  const [task] = await db
    .select()
    .from(weeklyTasks)
    .where(eq(weeklyTasks.id, taskId));
  if (!task || task.weekId !== week.id) {
    return { error: "タスクが見つかりません" };
  }

  await db
    .update(weeklyTasks)
    .set({ status: "dropped" })
    .where(eq(weeklyTasks.id, taskId));

  await db.insert(planChanges).values({
    weekId: week.id,
    taskId,
    changeType: "drop",
    beforeJson: {
      title: task.title,
      status: task.status,
      estimatedMinutesCode: task.estimatedMinutesCode,
    },
    afterJson: { status: "dropped" },
  });

  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/review");
  return { ok: true };
}

export async function updateTaskEstimate(
  taskId: string,
  estimatedMinutesCode: EstimateCode,
) {
  const user = await requireUser();
  const week = await getOrCreateCurrentWeek(user.id);
  await assertWeekOpen(week.id);

  const db = getDb();
  const [task] = await db
    .select()
    .from(weeklyTasks)
    .where(eq(weeklyTasks.id, taskId));
  if (!task || task.weekId !== week.id) {
    return { error: "タスクが見つかりません" };
  }

  await db
    .update(weeklyTasks)
    .set({ estimatedMinutesCode })
    .where(eq(weeklyTasks.id, taskId));

  await db.insert(planChanges).values({
    weekId: week.id,
    taskId,
    changeType: "edit_estimate",
    beforeJson: { estimatedMinutesCode: task.estimatedMinutesCode },
    afterJson: { estimatedMinutesCode },
  });

  revalidatePath("/");
  revalidatePath("/review");
  return { ok: true };
}
