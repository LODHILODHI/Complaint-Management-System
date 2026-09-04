import { NextRequest } from "next/server";
import { ComplaintStatus, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { complaintAdminInclude } from "@/lib/complaints";
import { prisma } from "@/lib/prisma";
import { resolveComplaintSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, [Role.DEPARTMENT_HEAD]);
    const { id } = await context.params;
    const body = resolveComplaintSchema.parse(await request.json());

    const complaint = await prisma.complaint.findFirst({
      where: { id, assignedDeptHeadId: auth.id },
    });
    if (!complaint) {
      return fail("Complaint not found", 404);
    }

    if (complaint.status === ComplaintStatus.RESOLVED) {
      return fail("Complaint is already resolved", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.complaintComment.create({
        data: {
          complaintId: id,
          commentedBy: auth.id,
          comment: body.comment,
          isFinalResolution: true,
        },
      });

      return tx.complaint.update({
        where: { id },
        data: { status: ComplaintStatus.RESOLVED },
        include: complaintAdminInclude,
      });
    });

    return success(updated);
  } catch (error) {
    return handleError(error);
  }
}
