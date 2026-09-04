import { NextRequest } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAdminUserSchema } from "@/lib/validators";

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
} satisfies Prisma.UserSelect;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      return fail("User not found", 404);
    }

    return success(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;
    const body = updateAdminUserSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return fail("User not found", 404);
    }

    const nextRole = (body.role ?? existing.role) as Role;

    if (body.role && body.role !== existing.role && existing.id === auth.id) {
      return fail("You cannot change your own role", 400);
    }

    if (nextRole === Role.DEPARTMENT_HEAD) {
      const deptIds = body.departmentIds;
      if (!deptIds || deptIds.length < 1) {
        return fail("Select at least one department for HOD", 400);
      }
      const departments = await prisma.department.findMany({
        where: { id: { in: deptIds } },
      });
      if (departments.length !== deptIds.length) {
        return fail("One or more departments were not found", 404);
      }
    }

    if (
      nextRole === Role.USER &&
      body.homeDepartmentId !== undefined &&
      body.homeDepartmentId !== null
    ) {
      const home = await prisma.department.findUnique({
        where: { id: body.homeDepartmentId },
      });
      if (!home) {
        return fail("Department not found", 404);
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

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined
          ? { email: body.email.toLowerCase() }
          : {}),
        ...(body.password !== undefined
          ? { password: await hashPassword(body.password) }
          : {}),
        ...(body.role !== undefined ? { role: body.role as Role } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(nextRole === Role.USER
          ? body.homeDepartmentId !== undefined
            ? { homeDepartmentId: body.homeDepartmentId }
            : {}
          : { homeDepartmentId: null }),
        ...(nextRole === Role.DEPARTMENT_HEAD && body.departmentIds
          ? {
              managedDepartments: {
                set: body.departmentIds.map((deptId) => ({ id: deptId })),
              },
            }
          : nextRole !== Role.DEPARTMENT_HEAD
            ? { managedDepartments: { set: [] } }
            : {}),
      },
      select: userSelect,
    });

    return success(user);
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
    const auth = await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;

    if (id === auth.id) {
      return fail("You cannot delete your own account", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            complaintsFiled: true,
            complaintsAssigned: true,
            comments: true,
          },
        },
      },
    });

    if (!existing) {
      return fail("User not found", 404);
    }

    await prisma.user.delete({ where: { id } });
    return success({ id, deleted: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return fail(
        "Cannot delete this user because related records still exist",
        400,
      );
    }
    return handleError(error);
  }
}
