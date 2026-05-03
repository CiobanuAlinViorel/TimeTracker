import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const HOUR_IN_MS = 1000 * 60 * 60;
const WORKBOOK_FILE_NAME = "results.xlsx";
const SUMMARY_SHEET_NAME = "Reports";

type SearchParamValue = string | string[] | undefined;

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

type WorkbookReport = {
  sheetName: string;
  reportType: string;
  periodLabel: string;
  generatedAtIso: string;
  totalHours: number;
  totalTime: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getSingleValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function buildRedirect(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `${pathname}?${searchParams.toString()}`;
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
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
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

function getResultsWorkbookPath(userId: string) {
  return path.join(process.cwd(), "data", "exports", userId, WORKBOOK_FILE_NAME);
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureWorkbookDirectory(userId: string) {
  await fs.mkdir(path.dirname(getResultsWorkbookPath(userId)), { recursive: true });
}

async function getCurrentUser() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/user/login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/user/login");
  }

  return user;
}

async function loadWorkbook(filePath: string) {
  if (!(await pathExists(filePath))) {
    return XLSX.utils.book_new();
  }

  return XLSX.readFile(filePath, { cellDates: true });
}

function replaceSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  worksheet: XLSX.WorkSheet
) {
  const existingIndex = workbook.SheetNames.indexOf(sheetName);

  if (existingIndex >= 0) {
    workbook.SheetNames.splice(existingIndex, 1);
    delete workbook.Sheets[sheetName];
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

function moveSheetToFront(workbook: XLSX.WorkBook, sheetName: string) {
  const currentIndex = workbook.SheetNames.indexOf(sheetName);

  if (currentIndex <= 0) {
    return;
  }

  workbook.SheetNames.splice(currentIndex, 1);
  workbook.SheetNames.unshift(sheetName);
}

function getCellString(sheet: XLSX.WorkSheet | undefined, address: string) {
  const cell = sheet?.[address];

  if (!cell?.v) {
    return "";
  }

  return String(cell.v).trim();
}

function getCellNumber(sheet: XLSX.WorkSheet | undefined, address: string) {
  const cell = sheet?.[address];

  if (!cell) {
    return 0;
  }

  const value = typeof cell.v === "number" ? cell.v : Number(cell.v);
  return Number.isFinite(value) ? value : 0;
}

function getWorkbookReports(workbook: XLSX.WorkBook): WorkbookReport[] {
  return workbook.SheetNames.filter((sheetName) => sheetName !== SUMMARY_SHEET_NAME)
    .map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];

      return {
        sheetName,
        reportType: getCellString(sheet, "B2") || "Report",
        periodLabel: getCellString(sheet, "B5"),
        generatedAtIso: getCellString(sheet, "B6"),
        totalHours: getCellNumber(sheet, "B7"),
        totalTime: getCellString(sheet, "B8"),
      };
    })
    .sort((left, right) => right.generatedAtIso.localeCompare(left.generatedAtIso));
}

function rebuildSummarySheet(workbook: XLSX.WorkBook) {
  const reports = getWorkbookReports(workbook);
  const rows: Array<Array<string | number>> = [
    ["Saved Report", "Type", "Period", "Generated", "Total Time", "Total Hours"],
    ...reports.map((report) => [
      report.sheetName,
      report.reportType,
      report.periodLabel,
      report.generatedAtIso,
      report.totalTime,
      formatDecimalHours(report.totalHours),
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
  ];

  replaceSheet(workbook, SUMMARY_SHEET_NAME, worksheet);
  moveSheetToFront(workbook, SUMMARY_SHEET_NAME);
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
    return `Counted until ${formatDateTimeLabel(countedUntil)} (actual end ${formatDateTimeLabel(
      actualEnd
    )})`;
  }

  return formatDateTimeLabel(actualEnd);
}

async function buildReportWorksheet(
  user: CurrentUser,
  reportType: ReportType,
  range: DateRange
) {
  const now = new Date();
  const effectiveRangeEnd =
    range.end.getTime() < now.getTime() ? range.end : now;
  const entries = await prisma.dailyWorkTime.findMany({
    where: {
      user_id: user.id,
      start_hour: {
        gte: range.start,
        lte: effectiveRangeEnd,
      },
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

  return {
    sheetName,
    reportType,
    periodLabel: getRangeLabel(range),
    generatedAtIso,
    totalHours,
    totalTime: formatHoursLabel(totalHours),
    worksheet,
  };
}

async function saveReportToWorkbook(
  user: CurrentUser,
  reportType: ReportType,
  range: DateRange,
  overwrite: boolean
) {
  const workbookPath = getResultsWorkbookPath(user.id);
  await ensureWorkbookDirectory(user.id);

  const workbook = await loadWorkbook(workbookPath);
  const sheetName = getReportSheetName(reportType, range);

  if (!overwrite && workbook.SheetNames.includes(sheetName)) {
    return {
      saved: false,
      sheetName,
    };
  }

  const report = await buildReportWorksheet(user, reportType, range);
  replaceSheet(workbook, report.sheetName, report.worksheet);
  rebuildSummarySheet(workbook);
  XLSX.writeFile(workbook, workbookPath);

  return {
    saved: true,
    sheetName: report.sheetName,
  };
}

async function getWorkbookInfo(userId: string) {
  const workbookPath = getResultsWorkbookPath(userId);

  if (!(await pathExists(workbookPath))) {
    return {
      exists: false,
      updatedAt: null,
      reports: [] as WorkbookReport[],
    };
  }

  const [stats, workbook] = await Promise.all([
    fs.stat(workbookPath),
    loadWorkbook(workbookPath),
  ]);

  return {
    exists: true,
    updatedAt: stats.mtime,
    reports: getWorkbookReports(workbook),
  };
}

function getLatestWeekSuccessMessage(range: DateRange) {
  return `Saved week ${getRangeLabel(range)} to ${WORKBOOK_FILE_NAME}.`;
}

function getCurrentPeriodSuccessMessage(range: DateRange) {
  return `Saved current 15-14 situation (${getRangeLabel(range)}) to ${WORKBOOK_FILE_NAME}.`;
}

export function getExportFeedbackMessage(
  searchParams: Record<string, SearchParamValue>
) {
  return {
    error: getSingleValue(searchParams.error),
    success: getSingleValue(searchParams.success),
  };
}

export async function ensureAutomaticWeeklyWorkbookExport() {
  const user = await getCurrentUser();
  const latestFinishedWeek = getLatestFinishedWeekRange();

  await saveReportToWorkbook(user, "Weekly", latestFinishedWeek, false);
}

export async function getExportsPageData() {
  const user = await getCurrentUser();
  const latestFinishedWeek = getLatestFinishedWeekRange();
  const currentPeriod = getCurrentCustomMonthRange();

  await saveReportToWorkbook(user, "Weekly", latestFinishedWeek, false);

  const workbook = await getWorkbookInfo(user.id);

  return {
    workbook,
    latestFinishedWeekLabel: getRangeLabel(latestFinishedWeek),
    currentPeriodLabel: getRangeLabel(currentPeriod),
  };
}

export async function saveWorkbookReport(formData: FormData) {
  "use server";

  const report = formData.get("report");

  if (report !== "latest-week" && report !== "current-period") {
    redirect(
      buildRedirect("/exports", {
        error: "Please choose a valid export type.",
      })
    );
  }

  const user = await getCurrentUser();
  let successMessage = "";

  if (report === "latest-week") {
    const latestFinishedWeek = getLatestFinishedWeekRange();
    await saveReportToWorkbook(user, "Weekly", latestFinishedWeek, true);
    successMessage = getLatestWeekSuccessMessage(latestFinishedWeek);
  } else {
    const currentPeriod = getCurrentCustomMonthRange();
    await saveReportToWorkbook(user, "Period", currentPeriod, true);
    successMessage = getCurrentPeriodSuccessMessage(currentPeriod);
  }

  revalidatePath("/");
  revalidatePath("/exports");
  redirect(
    buildRedirect("/exports", {
      success: successMessage,
    })
  );
}

export { WORKBOOK_FILE_NAME, getResultsWorkbookPath };
