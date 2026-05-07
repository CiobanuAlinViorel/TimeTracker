import { auth } from "@/lib/auth";
import { generateReportXlsx } from "@/features/exports/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type !== "latest-week" && type !== "current-period") {
    return new Response("Invalid type", { status: 400 });
  }

  const { data, sheetName } = await generateReportXlsx(type);

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${sheetName}.xlsx"`,
    },
  });
}
