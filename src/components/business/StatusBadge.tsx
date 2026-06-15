import Badge from "@/components/ui/Badge";
import { ApplicationStatus, STATUS_LABELS } from "@/types";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variantMap: Record<ApplicationStatus, "success" | "warning" | "danger" | "primary" | "default"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    rescheduled: "primary",
    cancelled: "default",
  };

  return <Badge variant={variantMap[status]}>{STATUS_LABELS[status]}</Badge>;
};

export default StatusBadge;
