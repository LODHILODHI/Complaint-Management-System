import type { ComplaintStatus } from "@/lib/types";
import { statusLabel } from "@/lib/ui";

const classMap: Record<ComplaintStatus, string> = {
  OPEN: "badge badge-open",
  IN_PROGRESS: "badge badge-progress",
  RESOLVED: "badge badge-resolved",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={classMap[status]}>{statusLabel(status)}</span>;
}
