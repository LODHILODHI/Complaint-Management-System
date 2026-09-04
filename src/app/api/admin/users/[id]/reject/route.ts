import { NextRequest } from "next/server";
import { ApprovalStatus, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  approvalStatus: true,
  homeDepartmentId: true,
  otherDepartmentNote: true,
  profileCompleted: true,
  createdAt: true,
  updatedAt: true,
  homeDepartment: { select: { id: true, name: true } },
  managedDepartments: { select: { id: true, name: true } },
} as const;

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return fail("User not found", 404);
    }
    if (existing.role !== Role.USER) {
      return fail("Only citizen registrations can be rejected this way", 400);
    }
    if (existing.approvalStatus === ApprovalStatus.REJECTED) {
      return fail("User is already rejected", 400);
    }
    if (existing.approvalStatus === ApprovalStatus.APPROVED) {
      return fail("Cannot reject an already approved user from this action", 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { approvalStatus: ApprovalStatus.REJECTED },
      select: userSelect,
    });

    return success(user);
  } catch (error) {
    return handleError(error);
  }
}
