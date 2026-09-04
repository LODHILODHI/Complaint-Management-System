import { NextRequest } from "next/server";
import { ApprovalStatus, Prisma, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDepartmentHeadSchema } from "@/lib/validators";

const headSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  approvalStatus: true,
  profileCompleted: true,
  createdAt: true,
  updatedAt: true,
  managedDepartments: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, [Role.ADMIN]);

    const heads = await prisma.user.findMany({
      where: { role: Role.DEPARTMENT_HEAD },
      orderBy: { createdAt: "desc" },
      select: headSelect,
    });

    return success(heads);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const body = createDepartmentHeadSchema.parse(await request.json());

    const departments = await prisma.department.findMany({
      where: { id: { in: body.departmentIds } },
    });
    if (departments.length !== body.departmentIds.length) {
      return fail("One or more departments were not found", 404);
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      return fail("Email is already registered", 409);
    }

    const password = await hashPassword(body.password);
    const head = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        password,
        role: Role.DEPARTMENT_HEAD,
        approvalStatus: ApprovalStatus.APPROVED,
        profileCompleted: true,
        managedDepartments: {
          connect: body.departmentIds.map((id) => ({ id })),
        },
      },
      select: headSelect,
    });

    return success(head, 201);
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
