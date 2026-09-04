import { NextRequest } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDepartmentSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;
    const body = updateDepartmentSchema.parse(await request.json());

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return fail("Department not found", 404);
    }

    try {
      const department = await prisma.department.update({
        where: { id },
        data: { name: body.name },
        select: { id: true, name: true, createdAt: true },
      });
      return success(department);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return fail("Department name already exists", 409);
      }
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;

    const existing = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { complaints: true, heads: true } },
      },
    });

    if (!existing) {
      return fail("Department not found", 404);
    }

    if (existing._count.complaints > 0) {
      return fail(
        `Cannot delete: ${existing._count.complaints} complaint(s) still linked to this department`,
        400,
      );
    }

    await prisma.department.delete({ where: { id } });
    return success({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
