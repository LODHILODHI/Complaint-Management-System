import { ComplaintStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { complaintListInclude } from "@/lib/complaints";

export type ReportAuth = {
  id: string;
  role: Role;
};

export type ReportFilters = {
  status?: ComplaintStatus;
  departmentId?: string;
  from?: string;
  to?: string;
};

export async function buildReportWhere(
  auth: ReportAuth,
  filters: ReportFilters,
): Promise<{ where: Prisma.ComplaintWhereInput; scopeLabel: string }> {
  const and: Prisma.ComplaintWhereInput[] = [];

  if (filters.status) {
    and.push({ status: filters.status });
  }

  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) {
      createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    }
    if (filters.to) {
      createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
    }
    and.push({ createdAt });
  }

  let scopeLabel = "all";

  if (auth.role === Role.USER) {
    and.push({ userId: auth.id });
    scopeLabel = "my complaints";
  } else if (auth.role === Role.DEPARTMENT_HEAD) {
    const me = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { managedDepartments: { select: { id: true, name: true } } },
    });
    const deptIds = (me?.managedDepartments ?? []).map((d) => d.id);
    if (!deptIds.length) {
      and.push({ assignedDeptHeadId: auth.id });
      scopeLabel = "assigned to me";
    } else if (filters.departmentId && deptIds.includes(filters.departmentId)) {
      and.push({ departmentId: filters.departmentId });
      scopeLabel =
        me?.managedDepartments.find((d) => d.id === filters.departmentId)?.name ??
        "department";
    } else {
      and.push({ departmentId: { in: deptIds } });
      scopeLabel =
        me?.managedDepartments.map((d) => d.name).join(", ") || "my departments";
    }
  } else {
    // ADMIN
    if (filters.departmentId) {
      and.push({ departmentId: filters.departmentId });
      const dept = await prisma.department.findUnique({
        where: { id: filters.departmentId },
        select: { name: true },
      });
      scopeLabel = dept?.name ?? "department";
    } else {
      scopeLabel = "all";
    }
  }

  return {
    where: and.length ? { AND: and } : {},
    scopeLabel,
  };
}

export async function fetchReportComplaints(
  auth: ReportAuth,
  filters: ReportFilters,
) {
  const { where, scopeLabel } = await buildReportWhere(auth, filters);
  const items = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: complaintListInclude,
  });
  return { items, scopeLabel, total: items.length };
}
