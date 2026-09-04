import { NextRequest } from "next/server";
import { ComplaintStatus, Role } from "@prisma/client";
import { handleError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchReportComplaints } from "@/lib/reports";
import { z } from "zod";

const reportQuerySchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  departmentId: z.string().min(1).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = reportQuerySchema.parse({
      status: params.status || undefined,
      departmentId: params.departmentId || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    });

    const { items, scopeLabel, total } = await fetchReportComplaints(
      { id: auth.id, role: auth.role },
      {
        status: query.status as ComplaintStatus | undefined,
        departmentId: query.departmentId,
        from: query.from,
        to: query.to,
      },
    );

    let departments: { id: string; name: string }[] = [];
    if (auth.role === Role.ADMIN) {
      departments = await prisma.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
    } else if (auth.role === Role.DEPARTMENT_HEAD) {
      const me = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { managedDepartments: { select: { id: true, name: true } } },
      });
      departments = me?.managedDepartments ?? [];
    }

    return success({
      items,
      total,
      scopeLabel,
      role: auth.role,
      departments,
    });
  } catch (error) {
    return handleError(error);
  }
}
