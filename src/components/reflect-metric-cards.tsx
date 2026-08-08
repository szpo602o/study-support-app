export function ReflectMetricCards({
  studyTimeLabel,
  circleOrAboveRate,
  currentStreak,
}: {
  studyTimeLabel: string;
  circleOrAboveRate: number | null;
  currentStreak: number;
}) {
  const items = [
    {
      value: studyTimeLabel,
      label: "今月の学習時間",
    },
    {
      value:
        circleOrAboveRate == null ? "—" : `${circleOrAboveRate}%`,
      label: "○以上率",
    },
    {
      value: `${currentStreak}日`,
      label: "現在の連続記録",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`card px-3 py-3 ${
            index === 2 ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <p className="text-[22px] font-bold tabular-nums leading-none tracking-tight text-[var(--color-ink)]">
            {item.value}
          </p>
          <p className="mt-2 text-[11px] text-[var(--color-muted)]">
            {item.label}
          </p>
        </div>
      ))}
    </section>
  );
}
