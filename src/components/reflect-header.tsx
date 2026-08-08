import Link from "next/link";

export function ReflectHeader({
  monthYearLabel,
  prevMonthKey,
  nextMonthKey,
}: {
  monthYearLabel: string;
  prevMonthKey: string;
  nextMonthKey: string | null;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
        振り返り
      </h1>
      <div className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
        <Link
          href={`/reflect?month=${prevMonthKey}`}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-surface-soft)]"
          aria-label="前の月"
        >
          ＜
        </Link>
        <span className="min-w-[7.5rem] text-center tabular-nums">
          {monthYearLabel}
        </span>
        {nextMonthKey ? (
          <Link
            href={`/reflect?month=${nextMonthKey}`}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-surface-soft)]"
            aria-label="次の月"
          >
            ＞
          </Link>
        ) : (
          <span
            className="flex h-9 w-9 items-center justify-center text-[var(--color-line)]"
            aria-hidden
          >
            ＞
          </span>
        )}
      </div>
    </header>
  );
}
