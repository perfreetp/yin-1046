import { Bell, Search, Menu } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState, useMemo } from "react";

const Header = () => {
  const notifications = useStore((state) => state.notifications);
  const unreadCount = useStore((state) =>
    state.notifications.filter((n) => !n.isRead).length
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const markAllRead = useStore((state) => state.markAllNotificationsRead);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const today = new Date();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 ${weekdays[today.getDay()]}`;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center">
        <button className="lg:hidden mr-4 text-slate-600 hover:text-primary-600">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索申请、场地、社团..."
            className="w-64 h-9 pl-10 pr-4 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-500 hidden md:block">{dateStr}</span>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications.length > 9
                  ? "9+"
                  : unreadNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-card-hover border border-slate-200 z-50">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-medium text-slate-800">通知消息</h3>
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  全部已读
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {unreadNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    暂无未读通知
                  </div>
                ) : (
                  unreadNotifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-start">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${
                            n.type === "approval"
                              ? "bg-success-500"
                              : n.type === "rejection"
                              ? "bg-danger-500"
                              : n.type === "reschedule"
                              ? "bg-warning-500"
                              : "bg-primary-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {n.content}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {n.createdAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
