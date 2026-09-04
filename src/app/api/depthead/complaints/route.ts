import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { complaintAdminInclude } from "@/lib/complaints";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, [Role.DEPARTMENT_HEAD]);

    const complaints = await prisma.complaint.findMany({
      where: { assignedDeptHeadId: auth.id },
      orderBy: { createdAt: "desc" },
      include: complaintAdminInclude,
    });

    return success(complaints);
  } catch (error) {
    return handleError(error);
  }
}
