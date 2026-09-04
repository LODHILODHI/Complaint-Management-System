import { fail, handleError, success } from "@/lib/api-response";
import { comparePassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validators";

/** Simple password change: email + old password + new + confirm (no login required). */
export async function POST(request: Request) {
  try {
    const body = changePasswordSchema.parse(await request.json());

    if (!body.email) {
      return fail("Email is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user) {
      return fail("Invalid email or current password", 400);
    }

    const valid = await comparePassword(body.oldPassword, user.password);
    if (!valid) {
      return fail("Invalid email or current password", 400);
    }

    if (body.oldPassword === body.newPassword) {
      return fail("New password must be different from the current password", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(body.newPassword) },
    });

    return success({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    return handleError(error);
  }
}
