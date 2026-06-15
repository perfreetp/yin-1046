import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileCheck,
  Warehouse,
  AlertTriangle,
  BarChart3,
  Settings,
  CalendarClock,
} from "lucide-react";

const navItems = [
  {
    path: "/dashboard",
    label: "总览看板",
    icon: LayoutDashboard,
  },
  {
    path: "/approvals",
    label: "审批台",
    icon: FileCheck,
  },
  {
    path: "/resources",
    label: "资源库",
    icon: Warehouse,
  },
  {
    path: "/conflicts",
    label: "冲突处理",
    icon: AlertTriangle,
  },
  {
    path: "/statistics",
    label: "统计报表",
    icon: BarChart3,
  },
  {
    path: "/settings",
    label: "通知设置",
    icon: Settings,
  },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-primary-700 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="h-16 flex items-center px-6 border-b border-primary-600">
        <CalendarClock className="w-8 h-8 mr-3 text-amber-400" />
        <div>
          <h1 className="text-lg font-bold">排练统筹平台</h1>
          <p className="text-xs text-primary-300">资源总调度室</p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-md"
                      : "text-primary-200 hover:bg-primary-600/50 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-primary-600">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
            王
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">场馆管理王老师</p>
            <p className="text-xs text-primary-300">系统管理员</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
