import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getExportsPageData } from "@/features/exports/server";

export default async function ExportsPage() {
  const session = await auth();

  if (!session) {
    redirect("/user/login");
  }

  const { latestFinishedWeekLabel, currentPeriodLabel } = await getExportsPageData();

  return (
    <AppShell
      session={session}
      currentPath="/exports"
      title="Exports"
      description="Download your worked hours as an Excel file."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:max-w-2xl">
        <a
          href="/api/exports/results?type=latest-week"
          className="rounded-[26px] border border-brand-line bg-surface-strong p-5 shadow-sm transition-colors hover:bg-brand-wash"
        >
          <p className="font-semibold text-brand-deep">
            Download latest finished week
          </p>
          <p className="mt-1 text-sm text-[rgba(25,52,31,0.7)]">
            Monday to Sunday: {latestFinishedWeekLabel}
          </p>
        </a>

        <a
          href="/api/exports/results?type=current-period"
          className="rounded-[26px] border border-brand-line bg-surface-strong p-5 shadow-sm transition-colors hover:bg-brand-wash"
        >
          <p className="font-semibold text-brand-deep">
            Download current 15-14 situation
          </p>
          <p className="mt-1 text-sm text-[rgba(25,52,31,0.7)]">
            Current period: {currentPeriodLabel}
          </p>
        </a>
      </div>
    </AppShell>
  );
}
