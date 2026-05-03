import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { WorkEntryList } from "@/components/work-entry-list";
import { ensureAutomaticWeeklyWorkbookExport } from "@/features/exports/server";
import { auth } from "@/lib/auth";
import {
  formatDateLabel,
  formatDateTimeLabel,
  formatHoursLabel,
  getDashboardData,
} from "@/features/time-entries/server";
import { redirect } from "next/navigation";

function getSummaryCardClasses(isOnTarget: boolean | null) {
  if (isOnTarget === null) {
    return {
      container:
        "rounded-[26px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-5 shadow-sm",
      value: "mt-3 text-3xl font-bold tracking-tight text-[var(--brand-deep)]",
      meta: "mt-2 text-sm text-[color:rgba(25,52,31,0.66)]",
    };
  }

  if (isOnTarget) {
    return {
      container:
        "rounded-[26px] border border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(237,244,233,0.96),rgba(255,255,255,0.98))] p-5 shadow-sm",
      value: "mt-3 text-3xl font-bold tracking-tight text-[var(--brand)]",
      meta: "mt-2 text-sm text-[var(--brand)]",
    };
  }

  return {
    container:
      "rounded-[26px] border border-[#efcdc9] bg-[linear-gradient(180deg,rgba(252,232,230,0.92),rgba(255,255,255,0.98))] p-5 shadow-sm",
    value: "mt-3 text-3xl font-bold tracking-tight text-[#b93a32]",
    meta: "mt-2 text-sm text-[#b93a32]",
  };
}

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/user/login");
  }

  await ensureAutomaticWeeklyWorkbookExport();
  const { activeEntry, recentEntries, summaries } = await getDashboardData();
  const todayCard = getSummaryCardClasses(summaries.today.isOnTarget);
  const weekCard = getSummaryCardClasses(summaries.week.isOnTarget);
  const monthCard = getSummaryCardClasses(summaries.month.isOnTarget);

  return (
    <AppShell
      session={session}
      currentPath="/"
      title="Dashboard"
      description="Track finished intervals manually or start a session now and finish it later."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={todayCard.container}>
            <h3 className="text-sm font-medium text-[color:rgba(25,52,31,0.62)]">
              Today&apos;s Hours
            </h3>
            <p className={todayCard.value}>
              {formatHoursLabel(summaries.today.actual)}
            </p>
            <p className={todayCard.meta}>
              {summaries.today.target === null
                ? "No daily target until you start work today."
                : `Target to date: ${formatHoursLabel(summaries.today.target)}`}
            </p>
          </div>
          <div className={weekCard.container}>
            <h3 className="text-sm font-medium text-[color:rgba(25,52,31,0.62)]">
              This Week
            </h3>
            <p className={weekCard.value}>
              {formatHoursLabel(summaries.week.actual)}
            </p>
            <p className={weekCard.meta}>
              Target to date: {formatHoursLabel(summaries.week.target ?? 0)}
            </p>
          </div>
          <div className={monthCard.container}>
            <h3 className="text-sm font-medium text-[color:rgba(25,52,31,0.62)]">
              Current Month (15-14)
            </h3>
            <p className={monthCard.value}>
              {formatHoursLabel(summaries.month.actual)}
            </p>
            <p className={monthCard.meta}>
              Target to date: {formatHoursLabel(summaries.month.target ?? 0)}
            </p>
          </div>
          <div className="rounded-[26px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-5 shadow-sm">
            <h3 className="text-sm font-medium text-[color:rgba(25,52,31,0.62)]">
              Active Session
            </h3>
            <p className="mt-3 text-lg font-semibold text-[var(--brand-deep)]">
              {activeEntry
                ? `Started ${formatDateTimeLabel(activeEntry.start_hour)}`
                : "No active session"}
            </p>
            <p className="mt-2 text-sm text-[color:rgba(25,52,31,0.66)]">
              {activeEntry
                ? `Day: ${formatDateLabel(activeEntry.date)}`
                : "You can start one from the Start / Finish page."}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[var(--brand-deep)]">
              Recent Entries
            </h3>
            <WorkEntryList
              entries={recentEntries}
              emptyMessage="No work entries yet. Add one manually or start a live session."
            />
          </div>

          <div className="rounded-[28px] border border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(237,244,233,0.96))] p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--brand-deep)]">
              Quick Actions
            </h3>
            <div className="mt-4 grid gap-4">
              <Link
                href="/entries/manual"
                className="rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-4 transition-colors hover:bg-[var(--brand-wash)]"
              >
                <p className="font-medium text-[var(--brand-deep)]">Manual entry</p>
                <p className="mt-1 text-sm text-[color:rgba(25,52,31,0.7)]">
                  Add a completed interval with day, start hour, and end hour.
                </p>
              </Link>

              <Link
                href="/entries/live"
                className="rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-4 transition-colors hover:bg-[var(--brand-wash)]"
              >
                <p className="font-medium text-[var(--brand-deep)]">Start / Finish</p>
                <p className="mt-1 text-sm text-[color:rgba(25,52,31,0.7)]">
                  Start with a start hour now, then come back later to finish it.
                </p>
              </Link>

              <Link
                href="/exports"
                className="rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-4 transition-colors hover:bg-[var(--brand-wash)]"
              >
                <p className="font-medium text-[var(--brand-deep)]">Exports</p>
                <p className="mt-1 text-sm text-[color:rgba(25,52,31,0.7)]">
                  Save the latest finished week or the current 15-14 situation to Excel.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
