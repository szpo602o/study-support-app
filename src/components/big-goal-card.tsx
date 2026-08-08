import Link from "next/link";
import { IconBook, IconCalc, IconFlag, IconLeaf } from "@/components/icons";
import { getDailyQuoteSync } from "@/lib/daily-quote";
import { daysUntil, todayDateString } from "@/lib/dates";

type Goal = {
  id: string;
  title: string;
  examDate: string;
};

function TodayQuoteLine({ date }: { date: string }) {
  const daily = getDailyQuoteSync(date);

  return (
    <div className="mt-2 flex items-start gap-1.5">
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
      <section className="card p-4">
        <div className="flex items-center gap-2">
          <IconFlag className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="section-title">大目標</h2>
        </div>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          資格目標がまだありません
        </p>
        <Link
          href="/goals"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[var(--color-accent)]"
        >
          目標を設定する ＞
        </Link>
        <TodayQuoteLine date={today} />
      </section>
    );
  }

  const combined = goals.map((g) => g.title).join("・");

  return (
    <section className="card p-4">
      <div className="flex items-center gap-2">
        <IconFlag className="h-5 w-5 text-[var(--color-accent)]" />
        <h2 className="section-title">大目標</h2>
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
          const days = daysUntil(goal.examDate);
          const Icon = index % 2 === 0 ? IconBook : IconCalc;
          const daysLabel =
            days > 0 ? days : days === 0 ? 0 : Math.abs(days);
          return (
            <div
              key={goal.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-3"
            >
              <div className="flex items-start gap-1.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <p className="line-clamp-2 text-xs leading-snug text-[var(--color-muted)]">
                  {goal.title}
                </p>
              </div>
              <p className="mt-2 flex items-baseline gap-0.5">
                <span className="text-[36px] font-bold tabular-nums leading-none tracking-tight text-[var(--color-accent)]">
                  {daysLabel}
                </span>
                <span className="text-sm font-medium text-[var(--color-accent)]">
                  {days >= 0 ? "日" : "日経過"}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
