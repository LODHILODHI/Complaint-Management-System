import { NextRequest } from "next/server";
import { fail, handleError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCitizenProfileComplete } from "@/lib/profile";
import { updateProfileSchema } from "@/lib/validators";

const meSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  cnic: true,
  city: true,
  district: true,
  province: true,
  gender: true,
  dateOfBirth: true,
  alternatePhone: true,
  occupation: true,
  role: true,
  approvalStatus: true,
  homeDepartmentId: true,
  otherDepartmentNote: true,
  profileCompleted: true,
  createdAt: true,
  updatedAt: true,
  homeDepartment: { select: { id: true, name: true } },
  managedDepartments: { select: { id: true, name: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: meSelect,
    });

    if (!user) {
      return fail("User not found", 404);
    }

    return success({
      ...user,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().slice(0, 10)
        : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = updateProfileSchema.parse(await request.json());

    const hasAny =
      body.name !== undefined ||
      body.phone !== undefined ||
      body.address !== undefined ||
      body.cnic !== undefined ||
      body.city !== undefined ||
      body.district !== undefined ||
      body.province !== undefined ||
      body.gender !== undefined ||
      body.dateOfBirth !== undefined ||
      body.alternatePhone !== undefined ||
      body.occupation !== undefined;

    if (!hasAny) {
      return fail("Provide at least one field to update");
    }

    const existing = await prisma.user.findUnique({
      where: { id: auth.id },
      select: meSelect,
    });
    if (!existing) {
      return fail("User not found", 404);
    }

    const merged = {
      name: body.name ?? existing.name,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      address: body.address !== undefined ? body.address : existing.address,
      cnic: body.cnic !== undefined ? body.cnic : existing.cnic,
      city: body.city !== undefined ? body.city : existing.city,
      district: body.district !== undefined ? body.district : existing.district,
      province: body.province !== undefined ? body.province : existing.province,
    };

    const completed = isCitizenProfileComplete(merged);

    if (auth.role === "USER" && !completed) {
      const missing = [
        !merged.name?.trim() && "full name",
        !merged.phone?.trim() && "phone",
        !merged.address?.trim() && "address",
        !merged.cnic?.trim() && "CNIC",
        !merged.city?.trim() && "city",
        !merged.district?.trim() && "district",
        !merged.province?.trim() && "province",
      ].filter(Boolean);
      if (missing.length) {
        // Allow partial saves, but keep profileCompleted false
      }
    }

    const user = await prisma.user.update({
      where: { id: auth.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.cnic !== undefined ? { cnic: body.cnic } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.district !== undefined ? { district: body.district } : {}),
        ...(body.province !== undefined ? { province: body.province } : {}),
        ...(body.gender !== undefined ? { gender: body.gender } : {}),
        ...(body.dateOfBirth !== undefined
          ? {
              dateOfBirth: body.dateOfBirth
                ? new Date(`${body.dateOfBirth}T00:00:00.000Z`)
                : null,
            }
          : {}),
        ...(body.alternatePhone !== undefined
          ? { alternatePhone: body.alternatePhone }
          : {}),
        ...(body.occupation !== undefined ? { occupation: body.occupation } : {}),
        profileCompleted: auth.role === "USER" ? completed : true,
      },
      select: meSelect,
    });

    return success({
      ...user,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().slice(0, 10)
        : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
