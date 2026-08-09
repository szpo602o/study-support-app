import {
  letterGradeCssVar,
  type LetterGrade,
} from "@/lib/letter-grade";
import { SHINDANSHI_1ST_SUBJECTS, toReiwaLabel } from "@/lib/exam-subjects";
import type { ExamYearSummary } from "@/lib/queries";

function GradeStamp({ grade }: { grade: LetterGrade }) {
  return (
    <span
      className="grade-stamp grade-stamp--soft"
      style={{ color: letterGradeCssVar(grade) }}
    >
      <span className="grade-stamp-letter">{grade}</span>
      <span className="grade-stamp-label">判定</span>
    </span>
  );
}

export function ExamScoreSummaryCard({
  latest,
}: {
  latest: ExamYearSummary | null;
}) {
  if (!latest || latest.average === null || !latest.grade) {
    return (
      <section className="report-card p-4">
        <h1 className="section-title section-title-underline">成績表</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          中小企業診断士1次の過去問点数を記録すると、ここに総合判定が表示されます。
        </p>
      </section>
    );
  }

  return (
    <section className="report-card p-4">
      <div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_oklab,var(--color-chalkboard)_18%,var(--color-line))] pb-3">
        <div>
          <h1 className="section-title section-title-underline">成績表</h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            中小企業診断士1次 · {toReiwaLabel(latest.year)}
          </p>
        </div>
        <GradeStamp grade={latest.grade} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="school-label text-sm text-[var(--color-chalkboard)]">
            総合判定
          </p>
          <p
            className="grade-mark-xl mt-1 text-5xl tabular-nums"
            style={{ color: letterGradeCssVar(latest.grade) }}
          >
            {latest.grade}
          </p>
        </div>
        <p className="pb-1 text-right text-sm font-normal text-[var(--color-muted)]">
          平均{" "}
          <span className="text-xl font-bold tabular-nums text-[var(--color-ink)]">
            {latest.average}
          </span>
          点
        </p>
      </div>

      {latest.belowCutoff.length > 0 && (
        <div
          className="mt-4 rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-warn-soft)_35%,transparent)] px-3 py-2.5"
          style={{
            background: "var(--color-warn-soft-bg)",
            color: "var(--color-warn-soft)",
          }}
        >
          {latest.belowCutoff.map((item) => (
            <p key={item.subject} className="text-sm font-medium">
              △ {item.subject} {item.score}点
            </p>
          ))}
          <p className="mt-1 text-xs opacity-90">
            40点未満の科目があります
          </p>
        </div>
      )}
    </section>
  );
}

export function ExamScoreTable({
  years,
  byYear,
}: {
  years: number[];
  byYear: ExamYearSummary[];
}) {
  if (years.length === 0) {
    return (
      <section className="report-card p-4">
        <p className="text-sm text-[var(--color-muted)]">
          まだ点数がありません。下のフォームから追加してください。
        </p>
      </section>
    );
  }

  const byYearMap = new Map(byYear.map((y) => [y.year, y]));
  const subjectColWidth = 128;
  const yearColWidth = 52;
  const headerBg = "color-mix(in oklab, var(--color-chalkboard) 8%, var(--color-surface-soft))";
  const stickyBg = "var(--color-surface)";
  const softStickyBg = "color-mix(in oklab, var(--color-chalkboard) 6%, var(--color-surface-soft))";

  return (
    <section className="report-table-wrap p-0">
      <div className="overflow-x-auto">
        <table
          className="border-collapse text-sm"
          style={{
            minWidth: subjectColWidth + years.length * yearColWidth,
          }}
        >
          <thead>
            <tr
              className="border-b border-[color-mix(in_oklab,var(--color-chalkboard)_22%,var(--color-line))]"
              style={{ background: headerBg }}
            >
              <th
                className="sticky left-0 z-10 px-2 py-2.5 text-left text-xs font-semibold text-[var(--color-chalkboard)] shadow-[2px_0_4px_-2px_rgba(36,53,44,0.12)]"
                style={{
                  minWidth: subjectColWidth,
                  maxWidth: subjectColWidth,
                  background: headerBg,
                }}
              >
                科目
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className="px-1.5 py-2.5 text-center text-xs font-semibold text-[var(--color-chalkboard)]"
                  style={{ minWidth: yearColWidth }}
                >
                  {toReiwaLabel(year)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHINDANSHI_1ST_SUBJECTS.map((subject) => (
              <tr
                key={subject}
                className="border-b border-[color-mix(in_oklab,var(--color-line)_85%,transparent)] last:border-b-0"
              >
                <th
                  className="sticky left-0 z-10 px-2 py-2 text-left text-[11px] font-medium leading-snug text-[var(--color-ink)] shadow-[2px_0_4px_-2px_rgba(36,53,44,0.12)]"
                  style={{
                    minWidth: subjectColWidth,
                    maxWidth: subjectColWidth,
                    background: stickyBg,
                  }}
                >
                  {subject}
                </th>
                {years.map((year) => {
                  const score = byYearMap.get(year)?.scoresBySubject[subject];
                  const isLow = score !== undefined && score < 40;
                  return (
                    <td
                      key={`${subject}-${year}`}
                      className="px-1.5 py-2 text-center tabular-nums"
                      style={{
                        minWidth: yearColWidth,
                        color: isLow
                          ? "var(--color-pencil-red)"
                          : "var(--color-ink)",
                        fontWeight: isLow ? 600 : 500,
                      }}
                    >
                      {score ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr
              className="border-t border-[color-mix(in_oklab,var(--color-chalkboard)_22%,var(--color-line))]"
              style={{ background: softStickyBg }}
            >
              <th
                className="sticky left-0 z-10 px-2 py-2 text-left text-xs font-semibold text-[var(--color-ink)] shadow-[2px_0_4px_-2px_rgba(36,53,44,0.12)]"
                style={{
                  minWidth: subjectColWidth,
                  maxWidth: subjectColWidth,
                  background: softStickyBg,
                }}
              >
                平均
              </th>
              {years.map((year) => {
                const avg = byYearMap.get(year)?.average;
                return (
                  <td
                    key={`avg-${year}`}
                    className="px-1.5 py-2 text-center text-xs font-semibold tabular-nums text-[var(--color-ink)]"
                    style={{ minWidth: yearColWidth }}
                  >
                    {avg === null || avg === undefined ? "" : avg}
                  </td>
                );
              })}
            </tr>
            <tr style={{ background: softStickyBg }}>
              <th
                className="sticky left-0 z-10 px-2 py-2 text-left text-xs font-semibold text-[var(--color-ink)] shadow-[2px_0_4px_-2px_rgba(36,53,44,0.12)]"
                style={{
                  minWidth: subjectColWidth,
                  maxWidth: subjectColWidth,
                  background: softStickyBg,
                }}
              >
                判定
              </th>
              {years.map((year) => {
                const grade = byYearMap.get(year)?.grade;
                return (
                  <td
                    key={`grade-${year}`}
                    className="grade-mark-xl px-1.5 py-2 text-center text-base tabular-nums"
                    style={{
                      minWidth: yearColWidth,
                      color: grade
                        ? letterGradeCssVar(grade)
                        : "var(--color-muted)",
                    }}
                  >
                    {grade ?? ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
