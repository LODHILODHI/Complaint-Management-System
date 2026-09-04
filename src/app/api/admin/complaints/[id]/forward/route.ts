import { NextRequest } from "next/server";
import { ComplaintStatus, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { complaintAdminInclude } from "@/lib/complaints";
import { prisma } from "@/lib/prisma";
import { forwardComplaintSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;
    const body = forwardComplaintSchema.parse(await request.json());

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return fail("Complaint not found", 404);
    }

    if (complaint.status === ComplaintStatus.RESOLVED) {
      return fail("Cannot forward a resolved complaint", 400);
    }

    const deptHead = await prisma.user.findFirst({
      where: {
        id: body.assignedDeptHeadId,
        role: Role.DEPARTMENT_HEAD,
        managedDepartments: { some: { id: complaint.departmentId } },
      },
      include: { managedDepartments: { select: { id: true } } },
    });

    if (!deptHead) {
      return fail(
        "Department head not found or not assigned to this department",
        404,
      );
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assignedDeptHeadId: deptHead.id,
        status: ComplaintStatus.IN_PROGRESS,
      },
      include: complaintAdminInclude,
    });

    return success(updated);
  } catch (error) {
    return handleError(error);
  }
}
