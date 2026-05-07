import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getExportsPageData } from "@/features/exports/server";
import { DownloadButton } from "@/features/exports/download-button";

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
        <DownloadButton
          type="latest-week"
          title="Download latest finished week"
          subtitle={`Monday to Sunday: ${latestFinishedWeekLabel}`}
        />
        <DownloadButton
          type="current-period"
          title="Download current 15-14 situation"
          subtitle={`Current period: ${currentPeriodLabel}`}
        />
      </div>
    </AppShell>
  );
}
