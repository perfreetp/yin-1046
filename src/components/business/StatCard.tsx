import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import Card from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: "primary" | "success" | "warning" | "danger";
}

const StatCard = ({ title, value, icon: Icon, trend, color = "primary" }: StatCardProps) => {
  const colorClasses = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isUp ? (
                <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-500 mr-1" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isUp ? "text-success-600" : "text-danger-600"
                }`}
              >
                {trend.value}% 较上周
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
