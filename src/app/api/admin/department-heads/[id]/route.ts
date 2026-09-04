import { NextRequest } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDepartmentHeadSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

const headSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileCompleted: true,
  createdAt: true,
  updatedAt: true,
  managedDepartments: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;
    const body = updateDepartmentHeadSchema.parse(await request.json());

    const existing = await prisma.user.findFirst({
      where: { id, role: Role.DEPARTMENT_HEAD },
    });
    if (!existing) {
      return fail("Department head not found", 404);
    }

    if (body.departmentIds) {
      const departments = await prisma.department.findMany({
        where: { id: { in: body.departmentIds } },
      });
      if (departments.length !== body.departmentIds.length) {
        return fail("One or more departments were not found", 404);
      }
    }

    if (body.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: body.email.toLowerCase(),
          NOT: { id },
        },
      });
      if (emailTaken) {
        return fail("Email is already registered", 409);
      }
    }

    const head = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined
          ? { email: body.email.toLowerCase() }
          : {}),
        ...(body.password !== undefined
          ? { password: await hashPassword(body.password) }
          : {}),
        ...(body.departmentIds !== undefined
          ? {
              managedDepartments: {
                set: body.departmentIds.map((deptId) => ({ id: deptId })),
              },
            }
          : {}),
      },
      select: headSelect,
    });

    return success(head);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("Email is already registered", 409);
    }
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;

    const existing = await prisma.user.findFirst({
      where: { id, role: Role.DEPARTMENT_HEAD },
    });
    if (!existing) {
      return fail("Department head not found", 404);
    }

    await prisma.user.delete({ where: { id } });
    return success({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
