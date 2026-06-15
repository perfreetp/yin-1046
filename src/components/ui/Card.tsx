import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card = ({ children, className, hoverable = false }: CardProps) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-card border border-slate-100 transition-all duration-200",
        hoverable && "hover:shadow-card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = ({ children, className }: CardHeaderProps) => {
  return (
    <div
      className={cn(
        "px-6 py-4 border-b border-slate-100 flex items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

Card.Title = ({ children, className }: CardTitleProps) => {
  return (
    <h3 className={cn("text-base font-semibold text-slate-800", className)}>
      {children}
    </h3>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

Card.Body = ({ children, className }: CardBodyProps) => {
  return <div className={cn("p-6", className)}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = ({ children, className }: CardFooterProps) => {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
