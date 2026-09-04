import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import {
  shapeUserComplaint,
  userComplaintDetailInclude,
} from "@/lib/complaints";
import { prisma } from "@/lib/prisma";
import { isCitizenProfileComplete } from "@/lib/profile";
import { saveComplaintAttachment } from "@/lib/storage";
import { createComplaintFieldsSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, [Role.USER]);

    const complaints = await prisma.complaint.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    return success(complaints);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, [Role.USER]);

    const formData = await request.formData();
    const fields = createComplaintFieldsSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      departmentId: formData.get("departmentId"),
    });

    const filer = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        homeDepartmentId: true,
        name: true,
        phone: true,
        address: true,
        cnic: true,
        city: true,
        district: true,
        province: true,
        profileCompleted: true,
      },
    });
    if (!filer?.homeDepartmentId) {
      return fail(
        "You must be assigned to a department before filing a complaint. Contact an admin.",
        400,
      );
    }

    const { isCitizenProfileComplete } = await import("@/lib/profile");
    if (!isCitizenProfileComplete(filer)) {
      return fail(
        "Complete your profile before filing a complaint (phone, address, CNIC, city, district, province).",
        400,
      );
    }

    // Citizens may only file against their assigned home department
    const departmentId = filer.homeDepartmentId;
    if (fields.departmentId && fields.departmentId !== departmentId) {
      return fail("You can only file complaints for your assigned department", 403);
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return fail("Department not found", 404);
    }

    const files = formData
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);

    const complaint = await prisma.complaint.create({
      data: {
        title: fields.title,
        description: fields.description,
        departmentId,
        userId: auth.id,
      },
    });

    try {
      for (const file of files) {
        const stored = await saveComplaintAttachment(complaint.id, file);
        await prisma.complaintAttachment.create({
          data: {
            complaintId: complaint.id,
            fileUrl: stored.fileUrl,
            fileType: stored.fileType,
          },
        });
      }
    } catch (uploadError) {
      await prisma.complaint.delete({ where: { id: complaint.id } });
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "File upload failed";
      return fail(message, 400);
    }

    const created = await prisma.complaint.findUnique({
      where: { id: complaint.id },
      include: userComplaintDetailInclude,
    });

    return success(shapeUserComplaint(created!), 201);
  } catch (error) {
    return handleError(error);
  }
}
