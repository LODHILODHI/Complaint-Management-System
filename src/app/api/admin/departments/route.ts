import { NextRequest } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDepartmentSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const body = createDepartmentSchema.parse(await request.json());

    try {
      const department = await prisma.department.create({
        data: { name: body.name },
        select: { id: true, name: true, createdAt: true },
      });
      return success(department, 201);
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
