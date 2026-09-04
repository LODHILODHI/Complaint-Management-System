import { NextRequest } from "next/server";
import { fail, handleError, success } from "@/lib/api-response";
import { comparePassword, hashPassword, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validators";

/** Logged-in user changes own password (old + new + confirm). */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = changePasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user) {
      return fail("User not found", 404);
    }

    const valid = await comparePassword(body.oldPassword, user.password);
    if (!valid) {
      return fail("Current password is incorrect", 400);
    }

    if (body.oldPassword === body.newPassword) {
      return fail("New password must be different from the current password", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(body.newPassword) },
    });

    return success({ message: "Password updated successfully." });
  } catch (error) {
    return handleError(error);
  }
}
