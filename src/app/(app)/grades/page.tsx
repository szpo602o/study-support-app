import { ExamScoreForm } from "@/components/exam-score-form";
import {
  ExamScoreSummaryCard,
  ExamScoreTable,
} from "@/components/exam-scoreboard";
import {
  buildExamScoreboard,
  listExamScores,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function GradesPage() {
  const user = await requireUser();
  const rows = await listExamScores(user.id);
  const board = buildExamScoreboard(
    rows.map((r) => ({
      year: r.year,
      subject: r.subject,
      score: r.score,
    })),
  );

  return (
    <div className="space-y-[var(--section-gap)]">
      <ExamScoreSummaryCard latest={board.latest} />
      <ExamScoreTable years={board.years} byYear={board.byYear} />
      <ExamScoreForm defaultYear={board.latest?.year} />
    </div>
  );
}
