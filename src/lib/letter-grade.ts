/** 週次・過去問の A〜E 判定（日次の ◎○△× とは別系統） */

export type LetterGrade = "A" | "B" | "C" | "D" | "E";

/** 1日平均学習時間（分）→ 学習習慣の判定。記録なしは E */
export function gradeFromDailyAverageMinutes(
  avgMinutes: number | null,
): LetterGrade {
  if (avgMinutes === null) return "E";
  if (avgMinutes >= 90) return "A";
  if (avgMinutes >= 60) return "B";
  if (avgMinutes >= 30) return "C";
  if (avgMinutes >= 1) return "D";
  return "E";
}

/** 過去問平均点 → 実力判定 */
export function gradeFromExamAverage(avgScore: number): LetterGrade {
  if (avgScore >= 70) return "A";
  if (avgScore >= 60) return "B";
  if (avgScore >= 50) return "C";
  if (avgScore >= 40) return "D";
  return "E";
}

export function letterGradeLabel(grade: LetterGrade): string {
  return `${grade}判定`;
}

/** 通知表向けの落ち着いた色（日次記号の色と役割を分ける） */
export function letterGradeCssVar(grade: LetterGrade): string {
  switch (grade) {
    case "A":
      return "var(--color-grade-a)";
    case "B":
      return "var(--color-grade-b)";
    case "C":
      return "var(--color-grade-c)";
    case "D":
      return "var(--color-grade-d)";
    case "E":
      return "var(--color-grade-e)";
  }
}

export function letterGradeBgCssVar(grade: LetterGrade): string {
  switch (grade) {
    case "A":
      return "var(--color-grade-a-bg)";
    case "B":
      return "var(--color-grade-b-bg)";
    case "C":
      return "var(--color-grade-c-bg)";
    case "D":
      return "var(--color-grade-d-bg)";
    case "E":
      return "var(--color-grade-e-bg)";
  }
}
