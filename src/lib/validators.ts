import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    departmentId: z.string().min(1).optional(),
    otherDepartment: z.boolean().optional(),
    otherDepartmentNote: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.otherDepartment) {
      if (!data.otherDepartmentNote || data.otherDepartmentNote.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["otherDepartmentNote"],
          message: "Describe your department when selecting Other",
        });
      }
    } else if (!data.departmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message: "Select a department or Other",
      });
    }
  });

export const approveUserSchema = z.object({
  homeDepartmentId: z.string().min(1).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    email: z.string().trim().email().optional(),
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const adminSetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  address: z.string().trim().min(1).max(500).optional(),
  cnic: z.string().trim().min(5).max(20).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  district: z.string().trim().min(1).max(80).optional(),
  province: z.string().trim().min(1).max(80).optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional().nullable(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .nullable(),
  alternatePhone: z.string().trim().min(5).max(30).optional().nullable(),
  occupation: z.string().trim().min(1).max(120).optional().nullable(),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(120),
});

export const updateDepartmentSchema = createDepartmentSchema;

export const createAdminUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    password: z.string().min(6).max(128),
    role: z.enum(["USER", "ADMIN", "DEPARTMENT_HEAD"]),
    departmentIds: z.array(z.string().min(1)).optional(),
    homeDepartmentId: z.string().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "DEPARTMENT_HEAD") {
      if (!data.departmentIds || data.departmentIds.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["departmentIds"],
          message: "Select at least one department for HOD",
        });
      }
    }
    if (data.role === "USER" && !data.homeDepartmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["homeDepartmentId"],
        message: "Assign one department to the user",
      });
    }
  });

export const updateAdminUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(6).max(128).optional(),
    role: z.enum(["USER", "ADMIN", "DEPARTMENT_HEAD"]).optional(),
    departmentIds: z.array(z.string().min(1)).optional(),
    homeDepartmentId: z.string().min(1).nullable().optional(),
    phone: z.string().trim().min(5).max(30).optional().nullable(),
    address: z.string().trim().min(1).max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "DEPARTMENT_HEAD") {
      if (!data.departmentIds || data.departmentIds.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["departmentIds"],
          message: "Select at least one department for HOD",
        });
      }
    }
  });

export const updateDepartmentHeadSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).max(128).optional(),
  departmentIds: z.array(z.string().min(1)).min(1).optional(),
});

export const createDepartmentHeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
  departmentIds: z.array(z.string().min(1)).min(1, "Select at least one department"),
});

export const createComplaintFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  departmentId: z.string().min(1, "departmentId is required"),
});

export const forwardComplaintSchema = z.object({
  assignedDeptHeadId: z.string().min(1, "assignedDeptHeadId is required"),
});

export const commentSchema = z.object({
  comment: z.string().trim().min(1, "Comment is required").max(5000),
});

export const resolveComplaintSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "Final resolution comment is required")
    .max(5000),
});

export const complaintStatusQuerySchema = z
  .enum(["OPEN", "IN_PROGRESS", "RESOLVED"])
  .optional();
