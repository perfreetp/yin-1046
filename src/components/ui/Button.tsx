import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const Button = ({
  variant = "primary",
  size = "md",
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-300 shadow-sm",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300",
    danger:
      "bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-300",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200",
    outline:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
