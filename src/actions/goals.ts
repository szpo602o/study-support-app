"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  examResults,
  goals,
  milestones,
  roadmapItems,
} from "@/db/schema";
import { addDaysToDateString, todayDateString } from "@/lib/dates";
import type { MilestoneDecision } from "@/lib/labels";
import { requireUser } from "@/lib/session";

export async function createGoal(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "");

  if (!title || !examDate) {
    throw new Error("タイトルと試験日は必須です");
  }

  const db = getDb();
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(goals)
    .where(and(eq(goals.userId, user.id), eq(goals.status, "active")));

  if (Number(activeCount) >= 2) {
    throw new Error("アクティブな目標は最大2つまでです");
  }

  await db.insert(goals).values({
    userId: user.id,
    title,
    examDate,
  });

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/week");
}

export async function updateGoal(formData: FormData) {
  const user = await requireUser();
  const goalId = String(formData.get("goalId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "");

  if (!goalId || !title || !examDate) {
    throw new Error("必須項目が不足しています");
  }

  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal || goal.userId !== user.id) {
    throw new Error("目標が見つかりません");
  }

  await db
    .update(goals)
    .set({ title, examDate })
    .where(eq(goals.id, goalId));

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/week");
}

export async function archiveGoal(goalId: string, _formData?: FormData) {
  const user = await requireUser();
  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal || goal.userId !== user.id) {
    throw new Error("目標が見つかりません");
  }

  await db
    .update(goals)
    .set({ status: "archived", archivedAt: new Date() })
    .where(eq(goals.id, goalId));

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/week");
}

export async function addRoadmapItem(formData: FormData) {
  const user = await requireUser();
  const goalId = String(formData.get("goalId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const targetDate = String(formData.get("targetDate") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? 1);

  if (!goalId || !title || !targetDate) {
    throw new Error("必須項目が不足しています");
  }

  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal || goal.userId !== user.id) {
    throw new Error("目標が見つかりません");
  }

  const existing = await db
    .select()
    .from(roadmapItems)
    .where(eq(roadmapItems.goalId, goalId));
  if (existing.length >= 10) {
    throw new Error("ロードマップは最大10段階です");
  }

  await db.insert(roadmapItems).values({
    goalId,
    title,
    targetDate,
    originalTargetDate: targetDate,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : existing.length + 1,
  });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function setActiveMilestone(formData: FormData) {
  const user = await requireUser();
  const goalId = String(formData.get("goalId") ?? "");
  const roadmapItemId = String(formData.get("roadmapItemId") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!goalId || !roadmapItemId || !dueDate) {
    throw new Error("必須項目が不足しています");
  }

  const maxDue = addDaysToDateString(todayDateString(), 14);
  if (dueDate > maxDue) {
    throw new Error("中間目標の期限は今日から14日以内にしてください");
  }

  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal || goal.userId !== user.id) {
    throw new Error("目標が見つかりません");
  }

  await db
    .update(milestones)
    .set({ status: "replaced" })
    .where(
      and(eq(milestones.goalId, goalId), eq(milestones.status, "active")),
    );

  await db.insert(milestones).values({
    goalId,
    roadmapItemId,
    dueDate,
    status: "active",
  });

  await db
    .update(roadmapItems)
    .set({ status: "current" })
    .where(eq(roadmapItems.id, roadmapItemId));

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/review");
}

export async function decideMilestone(
  milestoneId: string,
  decision: MilestoneDecision,
) {
  await requireUser();
  const db = getDb();
  await db
    .update(milestones)
    .set({
      decision,
      status: decision === "catch_up" ? "overdue" : "active",
    })
    .where(eq(milestones.id, milestoneId));

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/review");
}

export async function completeMilestone(milestoneId: string) {
  await requireUser();
  const db = getDb();
  const [m] = await db
    .select()
    .from(milestones)
    .where(eq(milestones.id, milestoneId));
  if (!m) throw new Error("中間目標が見つかりません");

  await db
    .update(milestones)
    .set({ status: "done" })
    .where(eq(milestones.id, milestoneId));
  await db
    .update(roadmapItems)
    .set({ status: "done" })
    .where(eq(roadmapItems.id, m.roadmapItemId));

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function recordExamResult(formData: FormData) {
  const user = await requireUser();
  const goalId = String(formData.get("goalId") ?? "");
  const passed = String(formData.get("passed") ?? "") === "true";
  const scoreRaw = String(formData.get("score") ?? "").trim();
  const score = scoreRaw === "" ? null : scoreRaw;

  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal || goal.userId !== user.id) {
    throw new Error("目標が見つかりません");
  }

  await db
    .insert(examResults)
    .values({ goalId, passed, score })
    .onConflictDoUpdate({
      target: examResults.goalId,
      set: { passed, score, recordedAt: new Date() },
    });

  await db
    .update(goals)
    .set({ status: "completed", archivedAt: new Date() })
    .where(eq(goals.id, goalId));

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/week");
}
