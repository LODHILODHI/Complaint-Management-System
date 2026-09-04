import { ComplaintStatus, Prisma } from "@prisma/client";

const authorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const filerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  homeDepartmentId: true,
  homeDepartment: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export const complaintListInclude = {
  department: { select: { id: true, name: true } },
  attachments: true,
  assignedDeptHead: { select: authorSelect },
  user: { select: filerSelect },
} satisfies Prisma.ComplaintInclude;

export const complaintAdminInclude = {
  ...complaintListInclude,
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: authorSelect } },
  },
} satisfies Prisma.ComplaintInclude;

export const userComplaintDetailInclude = {
  department: { select: { id: true, name: true } },
  attachments: true,
  user: { select: filerSelect },
  comments: {
    where: { isFinalResolution: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      comment: true,
      isFinalResolution: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ComplaintInclude;

export type UserComplaintDetail = Prisma.ComplaintGetPayload<{
  include: typeof userComplaintDetailInclude;
}>;

/** User-facing detail: never expose internal comments. */
export function shapeUserComplaint(complaint: UserComplaintDetail) {
  const finalResolution =
    complaint.status === ComplaintStatus.RESOLVED && complaint.comments[0]
      ? {
          id: complaint.comments[0].id,
          comment: complaint.comments[0].comment,
          createdAt: complaint.comments[0].createdAt,
        }
      : null;

  const { comments: _omit, ...rest } = complaint;
  return {
    ...rest,
    finalResolution,
  };
}
