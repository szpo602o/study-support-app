import Link from "next/link";
import { IconBook, IconCalc, IconFlag, IconLeaf } from "@/components/icons";
import { getDailyQuoteSync } from "@/lib/daily-quote";
import { daysUntilInclusive, todayDateString } from "@/lib/dates";

type Goal = {
  id: string;
  title: string;
  examDate: string;
};

function TodayQuoteLine({ date }: { date: string }) {
  const daily = getDailyQuoteSync(date);

  return (
    <div className="mt-2 flex items-start gap-1.5 border-t border-dashed border-[var(--color-line)] pt-2">
      <IconLeaf className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-muted)] opacity-70" />
      <div className="min-w-0 leading-snug">
        <p className="text-[11px] text-[var(--color-muted)]">{daily.quote}</p>
        <p className="mt-0.5 text-[10px] text-[var(--color-muted)] opacity-60">
          — {daily.author}
        </p>
      </div>
    </div>
  );
}

export function BigGoalCard({ goals }: { goals: Goal[] }) {
  const today = todayDateString();

  if (goals.length === 0) {
    return (
      <section className="paper-card mt-1 p-4 pt-5">
        <div className="flex items-center gap-2">
          <IconFlag className="h-5 w-5 text-[var(--color-chalkboard)]" />
          <h2 className="section-title section-title-underline">大目標</h2>
        </div>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          資格目標がまだありません
        </p>
        <Link
          href="/goals"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[var(--color-chalkboard)]"
        >
          目標を設定する ＞
        </Link>
        <TodayQuoteLine date={today} />
      </section>
    );
  }

  const combined = goals.map((g) => g.title).join("・");

  return (
    <section className="paper-card mt-1 p-4 pt-5">
      <div className="flex items-center gap-2">
        <IconFlag className="h-5 w-5 text-[var(--color-chalkboard)]" />
        <h2 className="section-title section-title-underline">大目標</h2>
      </div>

      <p className="mt-3 text-[15px] font-medium leading-snug text-[var(--color-ink)]">
        {combined}
      </p>

      <TodayQuoteLine date={today} />

      <div
        className={`mt-4 grid gap-2.5 ${
          goals.length > 1 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {goals.map((goal, index) => {
          const days = daysUntilInclusive(goal.examDate);
          const Icon = index % 2 === 0 ? IconBook : IconCalc;
          const isPast = days < 0;
          const daysLabel = isPast ? Math.abs(days) : days;
          return (
            <div key={goal.id} className="chalkboard px-2.5 pb-3 pt-3.5">
              <span className="chalkboard-pin" aria-hidden />
              <div className="flex items-start gap-1.5">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e8e4d8] opacity-80" />
                <p className="line-clamp-2 text-[11px] leading-snug text-[#e8e4d8]/80">
                  {goal.title}
                </p>
              </div>
              <p className="mt-2 flex items-baseline justify-center gap-1">
                {isPast ? (
                  <>
                    <span className="chalk-number text-[30px] tabular-nums leading-none">
                      {daysLabel}
                    </span>
                    <span className="chalk-caption text-[11px]">日経過</span>
                  </>
                ) : (
                  <>
                    <span className="chalk-caption text-[11px]">あと</span>
                    <span className="chalk-number text-[30px] tabular-nums leading-none">
                      {daysLabel}
                    </span>
                    <span className="chalk-caption text-[11px]">日</span>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
