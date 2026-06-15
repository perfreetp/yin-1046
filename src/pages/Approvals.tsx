import { useState, useMemo } from "react";
import {
  Filter,
  Search,
  ChevronDown,
  Check,
  X,
  CalendarClock,
  Users,
  MapPin,
  User,
  Package,
  History,
  ArrowRightLeft,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/business/StatusBadge";
import ActivityLevelBadge from "@/components/business/ActivityLevelBadge";
import ConflictBadge from "@/components/business/ConflictBadge";
import { useStore } from "@/store/useStore";
import {
  RehearsalApplication,
  ApplicationStatus,
  ActivityLevel,
  CONFLICT_TYPE_LABELS,
  Conflict,
} from "@/types";
import { formatDateDisplay, getWeekdayName } from "@/utils/dateUtils";
import { calculatePriorityScore } from "@/utils/conflictUtils";

type PendingAction = "approve" | "reject" | "reschedule";

const Approvals = () => {
  const applications = useStore((state) => state.applications);
  const conflicts = useStore((state) => state.conflicts);
  const approveApplication = useStore((state) => state.approveApplication);
  const rejectApplication = useStore((state) => state.rejectApplication);
  const rescheduleApplication = useStore(
    (state) => state.rescheduleApplication
  );
  const currentUser = useStore((state) => state.currentUser);

  const pendingConflicts = useMemo(
    () => conflicts.filter((c) => c.status === "pending"),
    [conflicts]
  );

  const [selectedApp, setSelectedApp] = useState<RehearsalApplication | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [filterStatus, setFilterStatus] =
    useState<ApplicationStatus>("pending");
  const [filterLevel, setFilterLevel] = useState<ActivityLevel | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rescheduleSuggestion, setRescheduleSuggestion] = useState("");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );

  const sortedApps = [...applications]
    .filter((app) => app.status === filterStatus)
    .filter((app) =>
      filterLevel === "all" ? true : app.activityLevel === filterLevel
    )
    .filter((app) =>
      searchText
        ? app.activityName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          app.clubName.toLowerCase().includes(searchText.toLowerCase())
        : true
    )
    .map((app) => ({
      ...app,
      priorityScore: calculatePriorityScore(app),
    }))
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const getConflictsForApp = (appId: string): Conflict[] => {
    return pendingConflicts.filter((c) =>
      c.relatedApplicationIds.includes(appId)
    );
  };

  const hasConflict = (appId: string) => {
    return getConflictsForApp(appId).length > 0;
  };

  const executePendingAction = () => {
    if (!selectedApp || !pendingAction) return;
    setShowConflictConfirm(false);
    if (pendingAction === "approve") {
      approveApplication(selectedApp.id, currentUser.name);
      setShowDetail(false);
    } else if (pendingAction === "reject") {
      setShowRejectModal(true);
    } else if (pendingAction === "reschedule") {
      setShowRescheduleModal(true);
    }
    setPendingAction(null);
  };

  const handleApprove = (app: RehearsalApplication) => {
    const appConflicts = getConflictsForApp(app.id);
    setSelectedApp(app);
    if (appConflicts.length > 0) {
      setPendingAction("approve");
      setShowConflictConfirm(true);
    } else {
      approveApplication(app.id, currentUser.name);
      setShowDetail(false);
    }
  };

  const handleReject = () => {
    if (selectedApp && rejectReason) {
      rejectApplication(selectedApp.id, rejectReason, currentUser.name);
      setShowRejectModal(false);
      setShowDetail(false);
      setRejectReason("");
    }
  };

  const handleReschedule = () => {
    if (selectedApp && rescheduleSuggestion) {
      rescheduleApplication(
        selectedApp.id,
        rescheduleSuggestion,
        currentUser.name
      );
      setShowRescheduleModal(false);
      setShowDetail(false);
      setRescheduleSuggestion("");
    }
  };

  const openDetail = (app: RehearsalApplication) => {
    setSelectedApp(app);
    setShowDetail(true);
  };

  const initiateAction = (app: RehearsalApplication, action: PendingAction) => {
    const appConflicts = getConflictsForApp(app.id);
    setSelectedApp(app);
    if (appConflicts.length > 0) {
      setPendingAction(action);
      setShowConflictConfirm(true);
    } else {
      if (action === "reject") {
        setShowRejectModal(true);
      } else if (action === "reschedule") {
        setShowRescheduleModal(true);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">审批台</h2>
          <p className="text-sm text-slate-500 mt-1">
            按优先级排序的排练申请，支持批量处理
          </p>
        </div>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索申请..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 h-9 pl-10 pr-4 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex bg-slate-100 rounded-lg p-1">
                {(["pending", "approved", "rejected", "rescheduled"] as ApplicationStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterStatus === status
                          ? "bg-white text-primary-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {status === "pending" && "待审批"}
                      {status === "approved" && "已批准"}
                      {status === "rejected" && "已驳回"}
                      {status === "rescheduled" && "待改期"}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                活动级别
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            共 {sortedApps.length} 条申请
          </div>
        </Card.Header>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  活动信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  社团
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  级别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  场地
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  人数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  优先级
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedApps.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openDetail(app)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">
                        {app.activityName}
                      </p>
                      {hasConflict(app.id) && (
                        <ConflictBadge
                          severity={
                            getConflictsForApp(app.id)[0]?.severity || "low"
                          }
                          size="sm"
                          pulse
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {app.clubName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ActivityLevelBadge level={app.activityLevel} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      <p>{formatDateDisplay(app.date)}</p>
                      <p className="text-xs text-slate-400">
                        {app.startTime} - {app.endTime}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {app.venueName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {app.participantCount}人
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{
                            width: `${Math.min(app.priorityScore || 0, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {app.priorityScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(app);
                          }}
                          className="p-1.5 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="批准"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateAction(app, "reject");
                          }}
                          className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="驳回"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateAction(app, "reschedule");
                          }}
                          className="p-1.5 text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                          title="建议改期"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {app.status !== "pending" && (
                      <span className="text-xs text-slate-400">查看详情</span>
                    )}
                  </td>
                </tr>
              ))}
              {sortedApps.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    暂无相关申请
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={showDetail && !!selectedApp}
        onClose={() => setShowDetail(false)}
        title="申请详情"
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            {(() => {
              const detailConflicts = getConflictsForApp(selectedApp.id);
              return detailConflicts.length > 0 ? (
                <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                  <div className="flex items-center gap-2 text-warning-700 font-medium mb-3">
                    <AlertTriangle className="w-5 h-5" />
                    冲突信息
                  </div>
                  <div className="space-y-3">
                    {detailConflicts.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white rounded-lg p-3 border border-warning-100"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {CONFLICT_TYPE_LABELS[c.type]}
                          </span>
                          <ConflictBadge severity={c.severity} size="sm" />
                        </div>
                        <p className="text-sm text-slate-600">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {selectedApp.activityName}
              </h3>
              <div className="flex items-center gap-3">
                <ActivityLevelBadge level={selectedApp.activityLevel} />
                <StatusBadge status={selectedApp.status} />
                {hasConflict(selectedApp.id) && (
                  <ConflictBadge
                    severity={
                      getConflictsForApp(selectedApp.id)[0]?.severity || "low"
                    }
                    pulse
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  场地
                </div>
                <p className="font-medium text-slate-800">
                  {selectedApp.venueName}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <CalendarClock className="w-4 h-4 mr-2" />
                  时间
                </div>
                <p className="font-medium text-slate-800">
                  {formatDateDisplay(selectedApp.date)}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedApp.startTime} - {selectedApp.endTime}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <User className="w-4 h-4 mr-2" />
                  申请社团
                </div>
                <p className="font-medium text-slate-800">
                  {selectedApp.clubName}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <Users className="w-4 h-4 mr-2" />
                  参与人数
                </div>
                <p className="font-medium text-slate-800">
                  {selectedApp.participantCount} 人
                </p>
              </div>
            </div>

            {selectedApp.teacherName && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <User className="w-4 h-4 mr-2" />
                  指导老师
                </div>
                <p className="font-medium text-slate-800">
                  {selectedApp.teacherName}
                </p>
              </div>
            )}

            {selectedApp.equipmentNames.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <Package className="w-4 h-4 mr-2" />
                  需要设备
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.equipmentNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white rounded text-sm text-slate-600 border border-slate-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedApp.remark && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  备注
                </div>
                <p className="text-slate-700 text-sm">{selectedApp.remark}</p>
              </div>
            )}

            {selectedApp.rejectReason && (
              <div className="bg-danger-50 rounded-lg p-4 border border-danger-100">
                <div className="flex items-center text-danger-600 text-sm font-medium mb-2">
                  <X className="w-4 h-4 mr-2" />
                  驳回原因
                </div>
                <p className="text-danger-700 text-sm">
                  {selectedApp.rejectReason}
                </p>
              </div>
            )}

            {selectedApp.rescheduleSuggestion && (
              <div className="bg-warning-50 rounded-lg p-4 border border-warning-100">
                <div className="flex items-center text-warning-600 text-sm font-medium mb-2">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  改期建议
                </div>
                <p className="text-warning-700 text-sm">
                  {selectedApp.rescheduleSuggestion}
                </p>
              </div>
            )}

            {selectedApp.changeHistory.length > 0 && (
              <div>
                <div className="flex items-center text-slate-600 font-medium mb-3">
                  <History className="w-4 h-4 mr-2" />
                  变更历史
                </div>
                <div className="space-y-3">
                  {selectedApp.changeHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {record.action}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {record.operator} · {record.operatorRole}
                        </p>
                        {record.reason && (
                          <p className="text-xs text-slate-400 mt-1">
                            原因：{record.reason}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {record.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedApp.status === "pending" && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => initiateAction(selectedApp, "reschedule")}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  建议改期
                </Button>
                <Button
                  variant="danger"
                  onClick={() => initiateAction(selectedApp, "reject")}
                >
                  <X className="w-4 h-4 mr-2" />
                  驳回
                </Button>
                <Button onClick={() => handleApprove(selectedApp)}>
                  <Check className="w-4 h-4 mr-2" />
                  批准
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showConflictConfirm && !!selectedApp}
        onClose={() => {
          setShowConflictConfirm(false);
          setPendingAction(null);
        }}
        title="冲突确认"
        size="md"
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-warning-700 font-medium">
              <AlertTriangle className="w-5 h-5" />
              该申请存在以下冲突
            </div>
            <div className="space-y-3">
              {getConflictsForApp(selectedApp.id).map((c) => (
                <div
                  key={c.id}
                  className="bg-warning-50 rounded-lg p-3 border border-warning-200"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {CONFLICT_TYPE_LABELS[c.type]}
                    </span>
                    <ConflictBadge severity={c.severity} size="sm" />
                  </div>
                  <p className="text-sm text-slate-600">{c.description}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowConflictConfirm(false);
                  setPendingAction(null);
                }}
              >
                取消
              </Button>
              <Button onClick={executePendingAction}>
                仍然继续
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回申请"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            请填写驳回原因，申请社团将收到通知。
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入驳回原因..."
            className="w-full h-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowRejectModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason}
            >
              确认驳回
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="建议改期"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            请填写改期建议，申请社团可根据建议调整后重新提交。
          </p>
          <textarea
            value={rescheduleSuggestion}
            onChange={(e) => setRescheduleSuggestion(e.target.value)}
            placeholder="请输入改期建议，例如：建议调整到下周一上午..."
            className="w-full h-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowRescheduleModal(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleReschedule}
              disabled={!rescheduleSuggestion}
            >
              发送建议
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Approvals;
