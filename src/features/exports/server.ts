import "server-only";

import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const HOUR_IN_MS = 1000 * 60 * 60;

type CurrentUser = {
  id: string;
  username: string;
  email: string;
};

type DateRange = {
  start: Date;
  end: Date;
};

type ReportType = "Weekly" | "Period";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatHoursLabel(hours: number) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${wholeHours}h ${minutes}m`;
}

function formatDecimalHours(hours: number) {
  return Number(hours.toFixed(2));
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date);
  const day = start.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - distanceToMonday);
  return start;
}

function getCustomMonthStart(date: Date) {
  if (date.getDate() >= 15) {
    return new Date(date.getFullYear(), date.getMonth(), 15, 0, 0, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth() - 1, 15, 0, 0, 0, 0);
}

function getCustomMonthEnd(date: Date) {
  const start = getCustomMonthStart(date);
  return new Date(start.getFullYear(), start.getMonth() + 1, 14, 23, 59, 59, 999);
}

function getLatestFinishedWeekRange(reference = new Date()): DateRange {
  const currentWeekStart = getStartOfWeek(reference);
  const start = new Date(currentWeekStart);
  start.setDate(start.getDate() - 7);
  const end = new Date(currentWeekStart);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}

function getCurrentCustomMonthRange(reference = new Date()): DateRange {
  return {
    start: getCustomMonthStart(reference),
    end: getCustomMonthEnd(reference),
  };
}

function getReportSheetName(reportType: ReportType, range: DateRange) {
  const prefix = reportType === "Weekly" ? "Week" : "Period";
  return `${prefix} ${formatIsoDate(range.start)} to ${formatIsoDate(range.end)}`;
}

function getRangeLabel(range: DateRange) {
  return `${formatDateLabel(range.start)} - ${formatDateLabel(range.end)}`;
}

async function getCurrentUser() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/user/login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, email: true },
  });

  if (!user) {
    redirect("/user/login");
  }

  return user;
}

function resolveEntryEndLabel(
  actualEnd: Date | null,
  countedUntil: Date,
  cappedAtRangeEnd: boolean
) {
  if (!actualEnd) {
    return `Open at export time - counted until ${formatDateTimeLabel(countedUntil)}`;
  }
  if (cappedAtRangeEnd) {
    return `Counted until ${formatDateTimeLabel(countedUntil)} (actual end ${formatDateTimeLabel(actualEnd)})`;
  }
  return formatDateTimeLabel(actualEnd);
}

async function buildReportWorksheet(
  user: CurrentUser,
  reportType: ReportType,
  range: DateRange
) {
  const now = new Date();
  const effectiveRangeEnd = range.end.getTime() < now.getTime() ? range.end : now;
  const entries = await prisma.dailyWorkTime.findMany({
    where: {
      user_id: user.id,
      start_hour: { gte: range.start, lte: effectiveRangeEnd },
    },
    orderBy: [{ date: "asc" }, { start_hour: "asc" }],
  });

  const sheetName = getReportSheetName(reportType, range);
  const generatedAtIso = new Date().toISOString();

  let totalHours = 0;
  const entryRows = entries.map((entry) => {
    const actualEnd = entry.end_hour;
    const rawEnd = actualEnd ?? effectiveRangeEnd;
    const countedUntil =
      rawEnd.getTime() > effectiveRangeEnd.getTime() ? effectiveRangeEnd : rawEnd;
    const durationHours = Math.max(
      0,
      (countedUntil.getTime() - entry.start_hour.getTime()) / HOUR_IN_MS
    );
    totalHours += durationHours;

    return [
      formatDateLabel(entry.date),
      formatDateTimeLabel(entry.start_hour),
      resolveEntryEndLabel(
        actualEnd,
        countedUntil,
        actualEnd !== null && actualEnd.getTime() > effectiveRangeEnd.getTime()
      ),
      formatHoursLabel(durationHours),
      formatDecimalHours(durationHours),
    ];
  });

  if (entryRows.length === 0) {
    entryRows.push(["No entries found for this period.", "", "", "", ""]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Time Tracker Export"],
    ["Report Type", reportType],
    ["Sheet", sheetName],
    ["User", `${user.username} (${user.email})`],
    ["Period", getRangeLabel(range)],
    ["Generated", generatedAtIso],
    ["Total Hours", formatDecimalHours(totalHours)],
    ["Total Time", formatHoursLabel(totalHours)],
    [],
    ["Day", "Start", "End", "Duration", "Hours"],
    ...entryRows,
  ]);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 52 },
    { wch: 16 },
    { wch: 12 },
  ];
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

  return { sheetName, worksheet };
}

export async function getExportsPageData() {
  await getCurrentUser();
  const latestFinishedWeek = getLatestFinishedWeekRange();
  const currentPeriod = getCurrentCustomMonthRange();
  return {
    latestFinishedWeekLabel: getRangeLabel(latestFinishedWeek),
    currentPeriodLabel: getRangeLabel(currentPeriod),
  };
}

export async function generateReportXlsx(
  type: "latest-week" | "current-period"
): Promise<{ data: Buffer; sheetName: string }> {
  const user = await getCurrentUser();
  const reportType: ReportType = type === "latest-week" ? "Weekly" : "Period";
  const range =
    type === "latest-week" ? getLatestFinishedWeekRange() : getCurrentCustomMonthRange();

  const { sheetName, worksheet } = await buildReportWorksheet(user, reportType, range);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

  return { data, sheetName };
}
