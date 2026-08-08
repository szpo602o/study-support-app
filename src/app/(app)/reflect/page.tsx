import { CompactMonthCalendar } from "@/components/compact-month-calendar";
import { MonthSummaryCard } from "@/components/month-summary-card";
import { RecentWeeksList } from "@/components/recent-weeks-list";
import { ReflectHeader } from "@/components/reflect-header";
import { ReflectMetricCards } from "@/components/reflect-metric-cards";
import { formatMinutes } from "@/lib/labels";
import { getReflectContext } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ReflectPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getReflectContext(user.id, params.month);

  return (
    <div className="space-y-5">
      <ReflectHeader
        monthYearLabel={data.monthYearLabel}
        prevMonthKey={data.prevMonthKey}
        nextMonthKey={data.nextMonthKey}
      />

      <MonthSummaryCard
        monthYearLabel={data.monthYearLabel}
        counts={data.monthSummary.counts}
        circleOrAboveRate={data.monthSummary.circleOrAboveRate}
        unrecordedCount={data.unrecordedCount}
      />

      <CompactMonthCalendar cells={data.cells} />

      <ReflectMetricCards
        studyTimeLabel={formatMinutes(data.monthTotalMinutes)}
        circleOrAboveRate={data.monthSummary.circleOrAboveRate}
        currentStreak={data.currentStreak}
      />

      <RecentWeeksList weeks={data.recentWeeks} />
    </div>
  );
}
