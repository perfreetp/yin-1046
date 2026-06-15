import { useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit3,
  Save,
  History,
  Search,
  Filter,
  FileText,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useStore } from "@/store/useStore";
import { NOTIFICATION_TYPE_LABELS } from "@/types";

interface NotificationTemplate {
  id: string;
  type: "approval" | "rejection" | "reschedule" | "conflict" | "system";
  name: string;
  title: string;
  content: string;
  isEnabled: boolean;
}

const defaultTemplates: NotificationTemplate[] = [
  {
    id: "tpl1",
    type: "approval",
    name: "审批通过通知",
    title: "排练申请已批准",
    content: "您提交的「{活动名称}」申请已通过审批，请按时到场排练。\n\n场地：{场地名称}\n时间：{日期} {开始时间}-{结束时间}\n\n请注意保管好个人物品，排练结束后及时关闭设备电源。",
    isEnabled: true,
  },
  {
    id: "tpl2",
    type: "rejection",
    name: "审批驳回通知",
    title: "排练申请已驳回",
    content: "您提交的「{活动名称}」申请已被驳回。\n\n原因：{驳回原因}\n\n如有疑问，请联系场馆管理办公室。",
    isEnabled: true,
  },
  {
    id: "tpl3",
    type: "reschedule",
    name: "改期建议通知",
    title: "排练申请建议改期",
    content: "您提交的「{活动名称}」申请建议改期。\n\n原因：{改期原因}\n建议：{改期建议}\n\n请登录系统确认或重新提交申请。",
    isEnabled: true,
  },
  {
    id: "tpl4",
    type: "conflict",
    name: "冲突预警通知",
    title: "申请存在冲突，请关注",
    content: "您提交的「{活动名称}」申请存在{冲突类型}问题，请及时关注或调整。\n\n冲突详情：{冲突描述}",
    isEnabled: true,
  },
  {
    id: "tpl5",
    type: "system",
    name: "系统公告",
    title: "系统公告",
    content: "{公告内容}\n\n— 校艺术团排练统筹平台",
    isEnabled: true,
  },
];

const Settings = () => {
  const notifications = useStore((state) => state.notifications);
  const markNotificationRead = useStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useStore((state) => state.markAllNotificationsRead);

  const [activeTab, setActiveTab] = useState<"templates" | "push" | "history">("templates");
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [pushSettings, setPushSettings] = useState({
    inApp: true,
    email: true,
    sms: false,
    wechat: true,
    approvalNotify: true,
    rejectionNotify: true,
    rescheduleNotify: true,
    conflictNotify: true,
    systemNotify: true,
  });

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.includes(searchQuery) || n.content.includes(searchQuery);
    const matchesType = filterType === "all" || n.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate({ ...template });
    setIsModalOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
    );
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const toggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isEnabled: !t.isEnabled } : t))
    );
  };

  const togglePushSetting = (key: keyof typeof pushSettings) => {
    setPushSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case "rejection":
        return <XCircle className="w-5 h-5 text-danger-500" />;
      case "reschedule":
        return <Clock className="w-5 h-5 text-primary-500" />;
      case "conflict":
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case "system":
        return <Bell className="w-5 h-5 text-slate-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return dateStr.replace("T", " ").slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">通知设置</h2>
        <p className="text-sm text-slate-500 mt-1">
          配置通知模板、推送方式与查看通知历史记录
        </p>
      </div>

      <Card>
        <div className="border-b border-slate-200">
          <div className="flex space-x-1 px-6 py-3">
            {[
              { key: "templates", label: "通知模板", icon: FileText },
              { key: "push", label: "推送设置", icon: Bell },
              { key: "history", label: "通知记录", icon: History },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "templates" && (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getTypeIcon(template.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-slate-800">
                            {template.name}
                          </h4>
                          <Badge variant={template.isEnabled ? "success" : "default"}>
                            {template.isEnabled ? "已启用" : "已禁用"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {template.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <div
                        className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                          template.isEnabled ? "bg-primary-600" : "bg-slate-300"
                        }`}
                        onClick={() => toggleTemplate(template.id)}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform mt-0.5 ${
                            template.isEnabled ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "push" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-slate-800 mb-4">推送渠道</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "inApp", label: "站内消息", icon: MessageSquare, desc: "系统内通知中心推送" },
                    { key: "email", label: "邮件通知", icon: Mail, desc: "发送至社团联系人邮箱" },
                    { key: "sms", label: "短信通知", icon: Bell, desc: "发送至社团联系人手机" },
                    { key: "wechat", label: "微信通知", icon: Bell, desc: "企业微信/公众号推送" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <item.icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                          pushSettings[item.key as keyof typeof pushSettings]
                            ? "bg-primary-600"
                            : "bg-slate-300"
                        }`}
                        onClick={() => togglePushSetting(item.key as keyof typeof pushSettings)}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform mt-0.5 ${
                            pushSettings[item.key as keyof typeof pushSettings]
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-800 mb-4">通知事项</h4>
                <div className="space-y-3">
                  {[
                    { key: "approvalNotify", label: "审批通过通知", type: "approval" },
                    { key: "rejectionNotify", label: "审批驳回通知", type: "rejection" },
                    { key: "rescheduleNotify", label: "改期建议通知", type: "reschedule" },
                    { key: "conflictNotify", label: "冲突预警通知", type: "conflict" },
                    { key: "systemNotify", label: "系统公告通知", type: "system" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(item.type)}
                        <span className="text-slate-700">{item.label}</span>
                      </div>
                      <div
                        className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${
                          pushSettings[item.key as keyof typeof pushSettings]
                            ? "bg-primary-600"
                            : "bg-slate-300"
                        }`}
                        onClick={() => togglePushSetting(item.key as keyof typeof pushSettings)}
                      >
                        <div
                          className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform mt-0.5 ${
                            pushSettings[item.key as keyof typeof pushSettings]
                              ? "translate-x-5.5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Button onClick={() => {}}>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </Button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索通知..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">全部类型</option>
                      <option value="approval">审批通过</option>
                      <option value="rejection">审批驳回</option>
                      <option value="reschedule">改期建议</option>
                      <option value="conflict">冲突预警</option>
                      <option value="system">系统公告</option>
                    </select>
                  </div>
                </div>
                <Button variant="ghost" onClick={markAllNotificationsRead}>
                  全部标为已读
                </Button>
              </div>

              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>暂无通知记录</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${
                        notification.isRead
                          ? "border-slate-100 bg-white"
                          : "border-primary-200 bg-primary-50/50"
                      }`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="p-2 bg-slate-100 rounded-lg mr-3">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${
                            notification.isRead ? "text-slate-600" : "text-slate-800"
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          接收人：{notification.recipientName}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full ml-2 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="编辑通知模板"
        size="md"
      >
        {editingTemplate && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                模板名称
              </label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                通知标题
              </label>
              <input
                type="text"
                value={editingTemplate.title}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                通知内容
              </label>
              <textarea
                value={editingTemplate.content}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, content: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                可用变量：{"{活动名称}"}、{"{场地名称}"}、{"{日期}"}、{"{开始时间}"}、{"{结束时间}"}
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Settings;
