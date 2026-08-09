"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { studyLogs } from "@/db/schema";
import { todayDateString } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export async function saveStudyLog(input: {
  logDate: string;
  studyMinutes: number;
}) {
  const user = await requireUser();
  const minutes = Math.floor(Number(input.studyMinutes));

  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 24 * 60) {
    return { error: "学習時間は0〜1440分で入力してください" };
  }

  if (input.logDate > todayDateString()) {
    return { error: "未来の日付は入力できません" };
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(studyLogs)
    .where(
      and(
        eq(studyLogs.userId, user.id),
        eq(studyLogs.logDate, input.logDate),
      ),
    )
    .limit(1);

  const now = new Date();
  if (existing[0]) {
    await db
      .update(studyLogs)
      .set({
        studyMinutes: minutes,
        updatedAt: now,
      })
      .where(eq(studyLogs.id, existing[0].id));
  } else {
    await db.insert(studyLogs).values({
      userId: user.id,
      logDate: input.logDate,
      studyMinutes: minutes,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/history");
  revalidatePath("/reflect");
  revalidatePath("/grades");
  return { ok: true as const };
}
