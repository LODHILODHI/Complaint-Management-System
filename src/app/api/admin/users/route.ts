import { NextRequest } from "next/server";
import { ApprovalStatus, Prisma, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminUserSchema } from "@/lib/validators";

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

const roleFilter = new Set(["USER", "ADMIN", "DEPARTMENT_HEAD"]);

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, [Role.ADMIN]);

    const roleParam = request.nextUrl.searchParams.get("role");
    const statusParam = request.nextUrl.searchParams.get("approvalStatus");
    const role =
      roleParam && roleFilter.has(roleParam) ? (roleParam as Role) : undefined;
    const approvalStatus =
      statusParam === "PENDING" ||
      statusParam === "APPROVED" ||
      statusParam === "REJECTED"
        ? (statusParam as ApprovalStatus)
        : undefined;

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(approvalStatus ? { approvalStatus } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });

    return success(users);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const body = createAdminUserSchema.parse(await request.json());

    if (body.role === Role.DEPARTMENT_HEAD) {
      const departments = await prisma.department.findMany({
        where: { id: { in: body.departmentIds ?? [] } },
      });
      if (departments.length !== (body.departmentIds?.length ?? 0)) {
        return fail("One or more departments were not found", 404);
      }
    }

    if (body.role === Role.USER && body.homeDepartmentId) {
      const home = await prisma.department.findUnique({
        where: { id: body.homeDepartmentId },
      });
      if (!home) {
        return fail("Department not found", 404);
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      return fail("Email is already registered", 409);
    }

    const password = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        password,
        role: body.role as Role,
        approvalStatus: ApprovalStatus.APPROVED,
        profileCompleted: body.role !== Role.USER,
        ...(body.role === Role.USER
          ? { homeDepartmentId: body.homeDepartmentId ?? null }
          : { homeDepartmentId: null }),
        ...(body.role === Role.DEPARTMENT_HEAD
          ? {
              managedDepartments: {
                connect: (body.departmentIds ?? []).map((id) => ({ id })),
              },
            }
          : {}),
      },
      select: userSelect,
    });

    return success(user, 201);
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
