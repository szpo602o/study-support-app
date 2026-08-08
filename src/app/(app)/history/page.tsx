import { formatJaDate, weekLabel } from "@/lib/dates";
import { formatMinutes } from "@/lib/labels";
import { listWeekHistory } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Summary = {
  initialTaskCount?: number;
  initialDoneCount?: number;
  midWeekAddCount?: number;
  plannedMinutes?: number;
  donePlannedMinutes?: number;
  actualMinutesApprox?: number;
  planChangeCount?: number;
};

export default async function HistoryPage() {
  const user = await requireUser();
  const history = await listWeekHistory(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">履歴</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          連続日数やヒートマップではなく、週単位の記録カードです。
        </p>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">まだ週の記録がありません。</p>
      ) : (
        <ul className="space-y-3">
          {history.map(({ week, review }) => {
            const summary = (review?.summaryJson ?? {}) as Summary;
            return (
              <li
                key={week.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/90 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl">{weekLabel(week.startDate)}</h2>
                  <span className="text-sm text-[var(--muted)]">
                    {formatJaDate(week.startDate)}〜{formatJaDate(week.endDate)}
                    {week.status === "reviewed" ? " · 確定" : " · 未確定"}
                  </span>
                </div>
                {review ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--ink)]">
                    <li>
                      当初 {summary.initialTaskCount ?? 0} 件中{" "}
                      {summary.initialDoneCount ?? 0} 件完了
                    </li>
                    <li>途中追加 {summary.midWeekAddCount ?? 0} 件</li>
                    <li>
                      想定 {formatMinutes(summary.plannedMinutes ?? 0)} のうち完了{" "}
                      {formatMinutes(summary.donePlannedMinutes ?? 0)}
                    </li>
                    <li>
                      実績概算{" "}
                      {formatMinutes(summary.actualMinutesApprox ?? 0)}
                    </li>
                    <li>計画変更 {summary.planChangeCount ?? 0} 件</li>
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    まだレビュー確定されていません。
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
