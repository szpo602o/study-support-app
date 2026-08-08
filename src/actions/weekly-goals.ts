"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { goals, weeklyGoals } from "@/db/schema";
import { getWeekBounds } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export type WeeklyGoalInput = {
  goalId: string;
  content: string;
};

/** 今週の目標を最大2件で保存（空文字の行は削除） */
export async function saveWeeklyGoals(inputs: WeeklyGoalInput[]) {
  const user = await requireUser();
  const weekStart = getWeekBounds().startDate;
  const db = getDb();

  const cleaned = inputs
    .map((i) => ({
      goalId: i.goalId,
      content: i.content.trim(),
    }))
    .filter((i) => i.goalId && i.content)
    .slice(0, 2);

  if (cleaned.length === 0) {
    await db
      .delete(weeklyGoals)
      .where(
        and(
          eq(weeklyGoals.userId, user.id),
          eq(weeklyGoals.weekStart, weekStart),
        ),
      );
    revalidatePaths();
    return { ok: true as const };
  }

  const goalIds = cleaned.map((c) => c.goalId);
  const owned = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, user.id), inArray(goals.id, goalIds)));

  if (owned.length !== goalIds.length) {
    return { error: "目標が見つかりません" };
  }

  const existing = await db
    .select()
    .from(weeklyGoals)
    .where(
      and(eq(weeklyGoals.userId, user.id), eq(weeklyGoals.weekStart, weekStart)),
    );

  const keepGoalIds = new Set(cleaned.map((c) => c.goalId));
  const toDelete = existing.filter((e) => !keepGoalIds.has(e.goalId));
  for (const row of toDelete) {
    await db.delete(weeklyGoals).where(eq(weeklyGoals.id, row.id));
  }

  const now = new Date();
  for (const item of cleaned) {
    const found = existing.find((e) => e.goalId === item.goalId);
    if (found) {
      await db
        .update(weeklyGoals)
        .set({ content: item.content, updatedAt: now })
        .where(eq(weeklyGoals.id, found.id));
    } else {
      await db.insert(weeklyGoals).values({
        userId: user.id,
        goalId: item.goalId,
        weekStart,
        content: item.content,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  revalidatePaths();
  return { ok: true as const };
}

function revalidatePaths() {
  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/goals");
  revalidatePath("/reflect");
}
