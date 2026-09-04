import { NextRequest } from "next/server";
import { handleError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, createdAt: true },
    });
    return success(departments);
  } catch (error) {
    return handleError(error);
  }
}
