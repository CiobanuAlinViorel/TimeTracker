import { AppShell } from "@/components/app-shell";
import { WorkEntryList } from "@/components/work-entry-list";
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
        "rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-black",
      value: "mt-2 text-3xl font-bold text-black dark:text-white",
      meta: "mt-2 text-sm text-gray-600 dark:text-gray-400",
    };
  }

  if (isOnTarget) {
    return {
      container:
        "rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm dark:border-green-900 dark:bg-green-950/30",
      value: "mt-2 text-3xl font-bold text-green-700 dark:text-green-300",
      meta: "mt-2 text-sm text-green-700 dark:text-green-300",
    };
  }

  return {
    container:
      "rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/30",
    value: "mt-2 text-3xl font-bold text-red-700 dark:text-red-300",
    meta: "mt-2 text-sm text-red-700 dark:text-red-300",
  };
}

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/user/login");
  }

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
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={todayCard.container}>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Today's Hours
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
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Month (15-14)
            </h3>
            <p className={monthCard.value}>
              {formatHoursLabel(summaries.month.actual)}
            </p>
            <p className={monthCard.meta}>
              Target to date: {formatHoursLabel(summaries.month.target ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-black">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Session
            </h3>
            <p className="mt-2 text-lg font-semibold text-black dark:text-white">
              {activeEntry
                ? `Started ${formatDateTimeLabel(activeEntry.start_hour)}`
                : "No active session"}
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {activeEntry
                ? `Day: ${formatDateLabel(activeEntry.date)}`
                : "You can start one from the Start / Finish page."}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
              Recent Entries
            </h3>
            <WorkEntryList
              entries={recentEntries}
              emptyMessage="No work entries yet. Add one manually or start a live session."
            />
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Quick Actions
            </h3>
            <div className="mt-4 grid gap-4">
              <a
                href="/entries/manual"
                className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-zinc-950"
              >
                <p className="font-medium text-black dark:text-white">Manual entry</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Add a completed interval with day, start hour, and end hour.
                </p>
              </a>

              <a
                href="/entries/live"
                className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-zinc-950"
              >
                <p className="font-medium text-black dark:text-white">Start / Finish</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Start with a start hour now, then come back later to finish it.
                </p>
              </a>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
