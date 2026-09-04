import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { fail, handleError, success } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, [Role.ADMIN]);
    const { id } = await context.params;
    const body = commentSchema.parse(await request.json());

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return fail("Complaint not found", 404);
    }

    const comment = await prisma.complaintComment.create({
      data: {
        complaintId: id,
        commentedBy: auth.id,
        comment: body.comment,
        isFinalResolution: false,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return success(comment, 201);
  } catch (error) {
    return handleError(error);
  }
}
