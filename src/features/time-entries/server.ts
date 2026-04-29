import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const HOUR_IN_MS = 1000 * 60 * 60;

type SearchParamValue = string | string[] | undefined;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getSingleValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function buildRedirect(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `${path}?${searchParams.toString()}`;
}

function parseDateOnly(dateValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
}

function parseDateTime(dateValue: string, timeValue: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const [, hours, minutes] = timeMatch;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0
  );
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

function getEndOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
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

function getElapsedDaysInclusive(start: Date, end: Date) {
  return (
    Math.round(
      (getStartOfDay(end).getTime() - getStartOfDay(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function countWeekdaysInclusive(start: Date, end: Date) {
  const current = getStartOfDay(start);
  const last = getStartOfDay(end);
  let count = 0;

  while (current <= last) {
    if (!isWeekend(current)) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

function calculateHours(
  entries: Array<{ start_hour: Date; end_hour: Date | null }>,
  now = new Date()
) {
  return entries.reduce((total, entry) => {
    const endTime = entry.end_hour ?? now;

    return total + (endTime.getTime() - entry.start_hour.getTime()) / HOUR_IN_MS;
  }, 0);
}

function buildSummary(actual: number, target: number | null) {
  if (target === null) {
    return {
      actual,
      target,
      isOnTarget: null,
    };
  }

  return {
    actual,
    target,
    isOnTarget: actual >= target,
  };
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

export function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTimeInputValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatHoursLabel(hours: number) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${wholeHours}h ${minutes}m`;
}

export function formatDurationLabel(start: Date, end: Date | null) {
  if (!end) {
    return "In progress";
  }

  return formatHoursLabel((end.getTime() - start.getTime()) / HOUR_IN_MS);
}

export function getFeedbackMessage(searchParams: Record<string, SearchParamValue>) {
  return {
    error: getSingleValue(searchParams.error),
    success: getSingleValue(searchParams.success),
  };
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  const now = new Date();
  const dayStart = getStartOfDay(now);
  const dayEnd = getEndOfDay(now);
  const weekStart = getStartOfWeek(now);
  const monthStart = getCustomMonthStart(now);
  const weekTarget = 8 * getElapsedDaysInclusive(weekStart, now);
  const monthTarget = 8 * countWeekdaysInclusive(monthStart, now);

  const [todayEntries, weekEntries, monthEntries, activeEntry, recentEntries] =
    await Promise.all([
      prisma.dailyWorkTime.findMany({
        where: {
          user_id: user.id,
          start_hour: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: {
          start_hour: true,
          end_hour: true,
        },
      }),
      prisma.dailyWorkTime.findMany({
        where: {
          user_id: user.id,
          start_hour: {
            gte: weekStart,
            lte: dayEnd,
          },
        },
        select: {
          start_hour: true,
          end_hour: true,
        },
      }),
      prisma.dailyWorkTime.findMany({
        where: {
          user_id: user.id,
          start_hour: {
            gte: monthStart,
            lte: dayEnd,
          },
        },
        select: {
          start_hour: true,
          end_hour: true,
        },
      }),
      prisma.dailyWorkTime.findFirst({
        where: {
          user_id: user.id,
          end_hour: null,
        },
        orderBy: {
          start_hour: "desc",
        },
      }),
      prisma.dailyWorkTime.findMany({
        where: {
          user_id: user.id,
        },
        orderBy: [
          { date: "desc" },
          { start_hour: "desc" },
        ],
        take: 8,
      }),
    ]);

  const todayHours = calculateHours(todayEntries, now);
  const weekHours = calculateHours(weekEntries, now);
  const monthHours = calculateHours(
    monthEntries.filter((entry) => !isWeekend(entry.start_hour)),
    now
  );
  const hasStartedToday = todayEntries.length > 0;

  return {
    user,
    activeEntry,
    recentEntries,
    summaries: {
      today: buildSummary(todayHours, hasStartedToday ? 8 : null),
      week: buildSummary(weekHours, weekTarget),
      month: buildSummary(monthHours, monthTarget),
    },
  };
}

export async function getManualEntryPageData() {
  const user = await getCurrentUser();
  const recentEntries = await prisma.dailyWorkTime.findMany({
    where: {
      user_id: user.id,
    },
    orderBy: [
      { date: "desc" },
      { start_hour: "desc" },
    ],
    take: 12,
  });

  return { user, recentEntries };
}

export async function getLiveEntryPageData() {
  const user = await getCurrentUser();
  const [activeEntry, recentEntries] = await Promise.all([
    prisma.dailyWorkTime.findFirst({
      where: {
        user_id: user.id,
        end_hour: null,
      },
      orderBy: {
        start_hour: "desc",
      },
    }),
    prisma.dailyWorkTime.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: [
        { date: "desc" },
        { start_hour: "desc" },
      ],
      take: 8,
    }),
  ]);

  return { user, activeEntry, recentEntries };
}

export async function createManualEntry(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const day = formData.get("day");
  const startHour = formData.get("start_hour");
  const endHour = formData.get("end_hour");

  if (
    typeof day !== "string" ||
    typeof startHour !== "string" ||
    typeof endHour !== "string"
  ) {
    redirect(
      buildRedirect("/entries/manual", {
        error: "Please fill in day, start hour, and end hour.",
      })
    );
  }

  const date = parseDateOnly(day);
  const start = parseDateTime(day, startHour);
  const end = parseDateTime(day, endHour);

  if (!date || !start || !end) {
    redirect(
      buildRedirect("/entries/manual", {
        error: "The date or time format is invalid.",
      })
    );
  }

  if (end <= start) {
    redirect(
      buildRedirect("/entries/manual", {
        error: "End hour must be after start hour.",
      })
    );
  }

  await prisma.dailyWorkTime.create({
    data: {
      date,
      start_hour: start,
      end_hour: end,
      user_id: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/entries/manual");
  revalidatePath("/entries/live");
  redirect(
    buildRedirect("/entries/manual", {
      success: "Work entry added successfully.",
    })
  );
}

export async function startLiveEntry(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const day = formData.get("day");
  const startHour = formData.get("start_hour");

  if (typeof day !== "string" || typeof startHour !== "string") {
    redirect(
      buildRedirect("/entries/live", {
        error: "Please choose a day and a start hour.",
      })
    );
  }

  const existingActiveEntry = await prisma.dailyWorkTime.findFirst({
    where: {
      user_id: user.id,
      end_hour: null,
    },
  });

  if (existingActiveEntry) {
    redirect(
      buildRedirect("/entries/live", {
        error: "You already have a running entry to finish.",
      })
    );
  }

  const date = parseDateOnly(day);
  const start = parseDateTime(day, startHour);

  if (!date || !start) {
    redirect(
      buildRedirect("/entries/live", {
        error: "The date or time format is invalid.",
      })
    );
  }

  await prisma.dailyWorkTime.create({
    data: {
      date,
      start_hour: start,
      end_hour: null,
      user_id: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/entries/live");
  revalidatePath("/entries/manual");
  redirect(
    buildRedirect("/entries/live", {
      success: "Work session started.",
    })
  );
}

export async function finishLiveEntry(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const endHour = formData.get("end_hour");

  if (typeof endHour !== "string") {
    redirect(
      buildRedirect("/entries/live", {
        error: "Please provide an end hour.",
      })
    );
  }

  const activeEntry = await prisma.dailyWorkTime.findFirst({
    where: {
      user_id: user.id,
      end_hour: null,
    },
    orderBy: {
      start_hour: "desc",
    },
  });

  if (!activeEntry) {
    redirect(
      buildRedirect("/entries/live", {
        error: "There is no running entry to finish.",
      })
    );
  }

  const day = formatDateInputValue(activeEntry.date);
  const end = parseDateTime(day, endHour);

  if (!end) {
    redirect(
      buildRedirect("/entries/live", {
        error: "The end hour format is invalid.",
      })
    );
  }

  if (end <= activeEntry.start_hour) {
    redirect(
      buildRedirect("/entries/live", {
        error: "End hour must be after the start hour.",
      })
    );
  }

  await prisma.dailyWorkTime.update({
    where: {
      id: activeEntry.id,
    },
    data: {
      end_hour: end,
    },
  });

  revalidatePath("/");
  revalidatePath("/entries/live");
  revalidatePath("/entries/manual");
  redirect(
    buildRedirect("/entries/live", {
      success: "Work session finished.",
    })
  );
}
