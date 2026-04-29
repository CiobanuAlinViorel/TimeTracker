import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkEntryList } from "@/components/work-entry-list";
import {
  finishLiveEntry,
  formatDateInputValue,
  formatDateLabel,
  formatDateTimeLabel,
  formatTimeInputValue,
  getFeedbackMessage,
  getLiveEntryPageData,
  startLiveEntry,
} from "@/features/time-entries/server";

type LiveEntryPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function LiveEntryPage({
  searchParams,
}: LiveEntryPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/user/login");
  }

  const [{ activeEntry, recentEntries }, feedback] = await Promise.all([
    getLiveEntryPageData(),
    searchParams.then(getFeedbackMessage),
  ]);
  const now = new Date();

  return (
    <AppShell
      session={session}
      currentPath="/entries/live"
      title="Start And Finish Later"
      description="Start a work session with a start hour, then come back and add the end hour when you finish."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
          <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
            {activeEntry ? "Finish Current Session" : "Start New Session"}
          </h3>

          {feedback.error ? (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {feedback.error}
            </div>
          ) : null}

          {feedback.success ? (
            <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              {feedback.success}
            </div>
          ) : null}

          {activeEntry ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-950">
                <p className="text-sm text-gray-600 dark:text-gray-400">Day</p>
                <p className="font-medium text-black dark:text-white">
                  {formatDateLabel(activeEntry.date)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-950">
                <p className="text-sm text-gray-600 dark:text-gray-400">Started at</p>
                <p className="font-medium text-black dark:text-white">
                  {formatDateTimeLabel(activeEntry.start_hour)}
                </p>
              </div>

              <form action={finishLiveEntry} className="space-y-4">
                <div>
                  <label
                    htmlFor="end_hour"
                    className="mb-1 block text-sm font-medium text-black dark:text-white"
                  >
                    End hour
                  </label>
                  <input
                    id="end_hour"
                    name="end_hour"
                    type="time"
                    required
                    defaultValue={formatTimeInputValue(now)}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Finish session
                </button>
              </form>
            </div>
          ) : (
            <form action={startLiveEntry} className="space-y-4">
              <div>
                <label
                  htmlFor="day"
                  className="mb-1 block text-sm font-medium text-black dark:text-white"
                >
                  Day
                </label>
                <input
                  id="day"
                  name="day"
                  type="date"
                  required
                  defaultValue={formatDateInputValue(now)}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="start_hour"
                  className="mb-1 block text-sm font-medium text-black dark:text-white"
                >
                  Start hour
                </label>
                <input
                  id="start_hour"
                  name="start_hour"
                  type="time"
                  required
                  defaultValue={formatTimeInputValue(now)}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Start session
              </button>
            </form>
          )}
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
            Recent Entries
          </h3>
          <WorkEntryList
            entries={recentEntries}
            emptyMessage="No work entries yet. Start a session or add one manually."
          />
        </section>
      </div>
    </AppShell>
  );
}
