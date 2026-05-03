import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  getExportFeedbackMessage,
  getExportsPageData,
  saveWorkbookReport,
} from "@/features/exports/server";

type ExportsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default async function ExportsPage({ searchParams }: ExportsPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/user/login");
  }

  const [{ workbook, latestFinishedWeekLabel, currentPeriodLabel }, feedback] =
    await Promise.all([getExportsPageData(), searchParams.then(getExportFeedbackMessage)]);

  return (
    <AppShell
      session={session}
      currentPath="/exports"
      title="Exports"
      description="Save worked hours into a local Excel workbook and download it whenever you want to upload it to OneDrive."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(237,244,233,0.96))] p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-[var(--brand-deep)]">
            Save To Workbook
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:rgba(25,52,31,0.72)]">
            The workbook is stored locally as <span className="font-semibold">results.xlsx</span>.
            A finished weekly sheet is added automatically the first time you open the
            app after that week ends.
          </p>

          {feedback.error ? (
            <div className="mt-4 rounded-2xl border border-[#efcdc9] bg-[#fde8e6] px-4 py-3 text-sm text-[#b93a32]">
              {feedback.error}
            </div>
          ) : null}

          {feedback.success ? (
            <div className="mt-4 rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-wash)] px-4 py-3 text-sm text-[var(--brand-deep)]">
              {feedback.success}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <form action={saveWorkbookReport}>
              <input type="hidden" name="report" value="latest-week" />
              <button
                type="submit"
                className="w-full rounded-[24px] bg-[var(--brand)] px-4 py-3 text-left text-white transition-colors hover:bg-[var(--brand-deep)]"
              >
                <span className="block text-sm font-semibold">Save latest finished week</span>
                <span className="mt-1 block text-sm text-[color:rgba(255,255,255,0.82)]">
                  Monday to Sunday: {latestFinishedWeekLabel}
                </span>
              </button>
            </form>

            <form action={saveWorkbookReport}>
              <input type="hidden" name="report" value="current-period" />
              <button
                type="submit"
                className="w-full rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] px-4 py-3 text-left transition-colors hover:bg-[var(--brand-wash)]"
              >
                <span className="block text-sm font-semibold text-[var(--brand-deep)]">
                  Save current 15-14 situation
                </span>
                <span className="mt-1 block text-sm text-[color:rgba(25,52,31,0.68)]">
                  Current period: {currentPeriodLabel}
                </span>
              </button>
            </form>
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-4">
            <p className="text-sm font-semibold text-[var(--brand-deep)]">Workbook status</p>
            <p className="mt-2 text-sm text-[color:rgba(25,52,31,0.72)]">
              {workbook.exists
                ? `Last updated ${workbook.updatedAt?.toLocaleString("en-GB")}.`
                : "No workbook saved yet. Save one of the reports above to create it."}
            </p>

            {workbook.exists ? (
              <a
                href="/api/exports/results"
                className="mt-4 inline-flex rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-deep)]"
              >
                Download results.xlsx
              </a>
            ) : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--brand-deep)]">
                Saved Sheets
              </h3>
              <p className="mt-1 text-sm text-[color:rgba(25,52,31,0.68)]">
                Each save updates a sheet inside the same workbook.
              </p>
            </div>
            <span className="rounded-full bg-[var(--brand-wash)] px-3 py-1 text-xs font-medium text-[var(--brand-deep)]">
              {workbook.reports.length} saved
            </span>
          </div>

          {workbook.reports.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(237,244,233,0.92))] p-6 text-sm text-[color:rgba(25,52,31,0.72)]">
              No sheets yet. The first save will create the workbook and list it here.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {workbook.reports.map((report) => (
                <article
                  key={report.sheetName}
                  className="rounded-[24px] border border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,244,233,0.82))] p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-deep)]">
                        {report.sheetName}
                      </p>
                      <p className="mt-1 text-sm text-[color:rgba(25,52,31,0.68)]">
                        {report.periodLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--brand-wash)] px-3 py-1 text-xs font-medium text-[var(--brand-deep)]">
                      {report.totalTime}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[var(--brand-wash)]/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:rgba(25,52,31,0.52)]">
                        Type
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--brand-deep)]">
                        {report.reportType}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--brand-wash)]/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:rgba(25,52,31,0.52)]">
                        Hours
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--brand-deep)]">
                        {report.totalHours.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--brand-wash)]/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:rgba(25,52,31,0.52)]">
                        Generated
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--brand-deep)]">
                        {formatGeneratedAt(report.generatedAtIso)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
