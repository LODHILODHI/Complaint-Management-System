import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminSetPasswordSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

/** Super admin sets any user's password directly (no old password). */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;
    const body = adminSetPasswordSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return fail("User not found", 404);
    }

    await prisma.user.update({
      where: { id },
      data: { password: await hashPassword(body.newPassword) },
    });

    return success({
      id,
      message: `Password updated for ${existing.email}`,
    });
  } catch (error) {
    return handleError(error);
  }
}
