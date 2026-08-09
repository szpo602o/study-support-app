"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { examScores } from "@/db/schema";
import {
  EXAM_TYPE_SHINDANSHI_1ST,
  isShindanshi1stSubject,
} from "@/lib/exam-subjects";
import { requireUser } from "@/lib/session";

export async function upsertExamScore(input: {
  year: number;
  subject: string;
  score: number;
  examType?: string;
}) {
  const user = await requireUser();
  const examType = input.examType ?? EXAM_TYPE_SHINDANSHI_1ST;
  const year = Math.floor(Number(input.year));
  const score = Math.floor(Number(input.score));

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return { error: "年度を正しく選択してください" };
  }

  if (!isShindanshi1stSubject(input.subject)) {
    return { error: "科目を正しく選択してください" };
  }

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { error: "点数は0〜100で入力してください" };
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(examScores)
    .where(
      and(
        eq(examScores.userId, user.id),
        eq(examScores.examType, examType),
        eq(examScores.year, year),
        eq(examScores.subject, input.subject),
      ),
    )
    .limit(1);

  const now = new Date();
  if (existing[0]) {
    await db
      .update(examScores)
      .set({
        score,
        updatedAt: now,
      })
      .where(eq(examScores.id, existing[0].id));
  } else {
    await db.insert(examScores).values({
      userId: user.id,
      examType,
      year,
      subject: input.subject,
      score,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/");
  revalidatePath("/grades");
  revalidatePath("/week");
  return { ok: true as const };
}

export async function deleteExamScore(input: {
  year: number;
  subject: string;
  examType?: string;
}) {
  const user = await requireUser();
  const examType = input.examType ?? EXAM_TYPE_SHINDANSHI_1ST;

  if (!isShindanshi1stSubject(input.subject)) {
    return { error: "科目を正しく選択してください" };
  }

  const db = getDb();
  await db
    .delete(examScores)
    .where(
      and(
        eq(examScores.userId, user.id),
        eq(examScores.examType, examType),
        eq(examScores.year, Math.floor(Number(input.year))),
        eq(examScores.subject, input.subject),
      ),
    );

  revalidatePath("/");
  revalidatePath("/grades");
  revalidatePath("/week");
  return { ok: true as const };
}
