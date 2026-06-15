import { ConflictSeverity, CONFLICT_SEVERITY_LABELS } from "@/types";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConflictBadgeProps {
  severity: ConflictSeverity;
  size?: "sm" | "md";
  pulse?: boolean;
}

const ConflictBadge = ({ severity, size = "md", pulse = false }: ConflictBadgeProps) => {
  const colorMap: Record<ConflictSeverity, string> = {
    high: "text-danger-600 bg-danger-50",
    medium: "text-warning-600 bg-warning-50",
    low: "text-primary-600 bg-primary-50",
  };

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md font-medium",
        colorMap[severity],
        pulse && "animate-pulse"
      )}
    >
      <AlertTriangle className={cn("mr-1", iconSize)} />
      <span className={textSize}>{CONFLICT_SEVERITY_LABELS[severity]}</span>
    </span>
  );
};

export default ConflictBadge;
