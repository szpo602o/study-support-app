export type StudyRating =
  | "unrecorded"
  | "x"
  | "triangle"
  | "circle"
  | "doubleCircle";

export function getStudyRating(minutes: number | null): StudyRating {
  if (minutes === null) return "unrecorded";
  if (minutes === 0) return "x";
  if (minutes < 60) return "triangle";
  if (minutes < 90) return "circle";
  return "doubleCircle";
}

export function studyRatingLabel(rating: StudyRating): string {
  switch (rating) {
    case "unrecorded":
      return "-";
    case "x":
      return "×";
    case "triangle":
      return "△";
    case "circle":
      return "○";
    case "doubleCircle":
      return "◎";
  }
}

export function studyRatingMessage(
  minutes: number | null,
): { rating: StudyRating; label: string; message: string } {
  const rating = getStudyRating(minutes);
  const label = studyRatingLabel(rating);

  if (minutes === null) {
    return { rating, label, message: "まだ記録がありません" };
  }
  if (rating === "x") {
    return { rating, label, message: "学習なし" };
  }
  if (rating === "triangle") {
    const remain = 60 - minutes;
    return {
      rating,
      label,
      message: `最低ラインまであと${remain}分`,
    };
  }
  if (rating === "circle") {
    return { rating, label, message: "最低ライン達成" };
  }
  return { rating, label, message: "理想ライン達成" };
}

export function isCircleOrAbove(rating: StudyRating): boolean {
  return rating === "circle" || rating === "doubleCircle";
}

/** 連続記録用: 1分以上勉強した日 */
export function isStudiedDay(minutes: number | null): boolean {
  return minutes !== null && minutes >= 1;
}

export const QUICK_MINUTES = [0, 30, 60, 90] as const;

export function ratingCssVar(rating: StudyRating): string {
  switch (rating) {
    case "doubleCircle":
      return "var(--color-status-excellent)";
    case "circle":
      return "var(--color-status-good)";
    case "triangle":
      return "var(--color-status-fair)";
    case "x":
      return "var(--color-status-fail)";
    case "unrecorded":
      return "var(--color-status-empty)";
  }
}
