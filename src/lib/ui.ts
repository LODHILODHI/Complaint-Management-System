export function roleHome(role: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/complaints";
    case "DEPARTMENT_HEAD":
      return "/depthead/complaints";
    default:
      return "/user/complaints";
  }
}

export { postLoginPath } from "@/lib/profile";

export function statusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    default:
      return status;
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
