import fs from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const WORKBOOK_FILE_NAME = "results.xlsx";

function getResultsWorkbookPath(userId: string) {
  return path.join(process.cwd(), "data", "exports", userId, WORKBOOK_FILE_NAME);
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workbookPath = getResultsWorkbookPath(user.id);

  try {
    const fileBuffer = await fs.readFile(workbookPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${WORKBOOK_FILE_NAME}"`,
      },
    });
  } catch {
    return new Response("Workbook not found", { status: 404 });
  }
}
