export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Role = "USER" | "ADMIN" | "DEPARTMENT_HEAD";

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export type Department = {
  id: string;
  name: string;
  createdAt?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  approvalStatus?: ApprovalStatus;
  phone?: string | null;
  address?: string | null;
  cnic?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  alternatePhone?: string | null;
  occupation?: string | null;
  profileCompleted?: boolean;
  createdAt?: string;
  homeDepartmentId?: string | null;
  homeDepartment?: Department | null;
  otherDepartmentNote?: string | null;
  managedDepartments?: Department[];
};

export type ComplaintAttachment = {
  id: string;
  complaintId: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
};

export type ComplaintComment = {
  id: string;
  complaintId?: string;
  commentedBy?: string;
  comment: string;
  isFinalResolution: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
};

export type Complaint = {
  id: string;
  userId: string;
  departmentId: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  assignedDeptHeadId: string | null;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  attachments?: ComplaintAttachment[];
  comments?: ComplaintComment[];
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone?: string | null;
    homeDepartmentId?: string | null;
    homeDepartment?: Department | null;
  };
  assignedDeptHead?: { id: string; name: string; email: string; role: Role } | null;
  finalResolution?: {
    id: string;
    comment: string;
    createdAt: string;
  } | null;
};

export type DepartmentHead = {
  id: string;
  name: string;
  email: string;
  role?: Role;
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  managedDepartments?: Department[];
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; message: string; errors?: unknown };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
