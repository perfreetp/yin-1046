import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  children: ReactNode;
  className?: string;
}

const Badge = ({ variant = "default", children, className }: BadgeProps) => {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-success-100 text-success-700",
    warning: "bg-warning-100 text-warning-700",
    danger: "bg-danger-100 text-danger-700",
    primary: "bg-primary-100 text-primary-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
