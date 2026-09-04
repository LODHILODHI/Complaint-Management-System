import type { AuthUser } from "@/lib/types";

/** Fields required before a citizen can file complaints. */
export function isCitizenProfileComplete(user: {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  cnic?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
}): boolean {
  return Boolean(
    user.name?.trim() &&
      user.phone?.trim() &&
      user.address?.trim() &&
      user.cnic?.trim() &&
      user.city?.trim() &&
      user.district?.trim() &&
      user.province?.trim(),
  );
}

export function postLoginPath(user: AuthUser) {
  if (user.role === "USER" && !isCitizenProfileComplete(user)) {
    return "/user/profile";
  }
  switch (user.role) {
    case "ADMIN":
      return "/admin/complaints";
    case "DEPARTMENT_HEAD":
      return "/depthead/complaints";
    default:
      return "/user/complaints";
  }
}
