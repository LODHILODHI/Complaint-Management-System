import { ApprovalStatus, Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      return fail("Email is already registered", 409);
    }

    let homeDepartmentId: string | null = null;
    let otherDepartmentNote: string | null = null;

    if (body.otherDepartment) {
      otherDepartmentNote = body.otherDepartmentNote!.trim();
    } else if (body.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: body.departmentId },
      });
      if (!department) {
        return fail("Department not found", 404);
      }
      homeDepartmentId = department.id;
    }

    const password = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        password,
        role: Role.USER,
        approvalStatus: ApprovalStatus.PENDING,
        homeDepartmentId,
        otherDepartmentNote,
        profileCompleted: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        homeDepartmentId: true,
        otherDepartmentNote: true,
        createdAt: true,
      },
    });

    return success(
      {
        user,
        message:
          "Account created. An admin must approve your registration before you can sign in.",
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
