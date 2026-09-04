import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { complaintAdminInclude } from "@/lib/complaints";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: complaintAdminInclude,
    });

    if (!complaint) {
      return fail("Complaint not found", 404);
    }

    return success(complaint);
  } catch (error) {
    return handleError(error);
  }
}
