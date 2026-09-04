import { ApprovalStatus } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { comparePassword, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        homeDepartment: { select: { id: true, name: true } },
        managedDepartments: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return fail("Invalid email or password", 401);
    }

    const valid = await comparePassword(body.password, user.password);
    if (!valid) {
      return fail("Invalid email or password", 401);
    }

    if (user.approvalStatus === ApprovalStatus.PENDING) {
      return fail(
        "Your account is pending admin approval. You cannot sign in yet.",
        403,
      );
    }

    if (user.approvalStatus === ApprovalStatus.REJECTED) {
      return fail(
        "Your registration was rejected. Please contact an administrator.",
        403,
      );
    }

    const token = signToken({ userId: user.id, role: user.role });

    return success({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        phone: user.phone,
        address: user.address,
        cnic: user.cnic,
        city: user.city,
        district: user.district,
        province: user.province,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().slice(0, 10)
          : null,
        alternatePhone: user.alternatePhone,
        occupation: user.occupation,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
        homeDepartmentId: user.homeDepartmentId,
        homeDepartment: user.homeDepartment,
        otherDepartmentNote: user.otherDepartmentNote,
        managedDepartments: user.managedDepartments,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
