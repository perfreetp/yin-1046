import { ActivityLevel, ACTIVITY_LEVEL_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface ActivityLevelBadgeProps {
  level: ActivityLevel;
  showLabel?: boolean;
}

const ActivityLevelBadge = ({ level, showLabel = true }: ActivityLevelBadgeProps) => {
  const colorMap: Record<ActivityLevel, string> = {
    school_level: "bg-danger-500",
    college_level: "bg-warning-500",
    daily: "bg-primary-500",
    temporary: "bg-slate-400",
  };

  const bgColorMap: Record<ActivityLevel, string> = {
    school_level: "bg-danger-50 text-danger-700 border-danger-200",
    college_level: "bg-warning-50 text-warning-700 border-warning-200",
    daily: "bg-primary-50 text-primary-700 border-primary-200",
    temporary: "bg-slate-50 text-slate-600 border-slate-200",
  };

  if (showLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
          bgColorMap[level]
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", colorMap[level])} />
        {ACTIVITY_LEVEL_LABELS[level]}
      </span>
    );
  }

  return <span className={cn("w-2 h-2 rounded-full", colorMap[level])} />;
};

export default ActivityLevelBadge;
