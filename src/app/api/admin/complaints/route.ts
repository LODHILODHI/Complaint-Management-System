import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { complaintAdminInclude } from "@/lib/complaints";
import { prisma } from "@/lib/prisma";
import { complaintStatusQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, [Role.ADMIN]);

    const statusParam = request.nextUrl.searchParams.get("status") ?? undefined;
    const status = complaintStatusQuerySchema.parse(
      statusParam === null || statusParam === "" ? undefined : statusParam,
    );

    const complaints = await prisma.complaint.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: complaintAdminInclude,
    });

    return success(complaints);
  } catch (error) {
    return handleError(error);
  }
}
