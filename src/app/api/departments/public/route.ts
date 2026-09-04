import { NextRequest } from "next/server";
import { handleError, success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/** Public department list for signup (id + name only). */
export async function GET(_request: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return success(departments);
  } catch (error) {
    return handleError(error);
  }
}
