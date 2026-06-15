import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Users,
  Package,
  UserCheck,
  Clock3,
  CheckCircle,
  ChevronDown,
  Filter,
  Eye,
  Check,
  X,
  ChevronRight,
  ArrowRightLeft,
  MapPin,
  CalendarDays,
  Wrench,
  GraduationCap,
  UserRound,
  Star,
  Lightbulb,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ConflictBadge from "@/components/business/ConflictBadge";
import StatusBadge from "@/components/business/StatusBadge";
import ActivityLevelBadge from "@/components/business/ActivityLevelBadge";
import {
  Conflict,
  ConflictType,
  ConflictSeverity,
  CONFLICT_TYPE_LABELS,
  RehearsalApplication,
} from "@/types";
import { useStore } from "@/store/useStore";
import { formatDateDisplay } from "@/utils/dateUtils";
import { calculatePriorityScore } from "@/utils/conflictUtils";

type FilterType = "all" | ConflictType;

const Conflicts = () => {
  const conflicts = useStore((state) => state.conflicts);
  const applications = useStore((state) => state.applications);
  const resolveConflict = useStore((state) => state.resolveConflict);
  const approveApplication = useStore((state) => state.approveApplication);
  const rejectApplication = useStore((state) => state.rejectApplication);
  const rescheduleApplication = useStore((state) => state.rescheduleApplication);
  const currentUser = useStore((state) => state.currentUser);

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [resolveText, setResolveText] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);

  const filteredConflicts = conflicts.filter(
    (c) => filterType === "all" || c.type === filterType
  );

  const pendingConflicts = filteredConflicts.filter((c) => c.status === "pending");
  const resolvedConflicts = filteredConflicts.filter(
    (c) => c.status === "resolved"
  );

  const typeIcons: Record<ConflictType, typeof Clock> = {
    time_overlap: Clock,
    capacity_exceeded: Users,
    equipment_conflict: Package,
    teacher_conflict: UserCheck,
  };

  const openDetail = (conflict: Conflict) => {
    setSelectedConflict(conflict);
    setShowDetail(true);
  };

  const handleResolve = () => {
    if (selectedConflict && resolveText) {
      resolveConflict(
        selectedConflict.id,
        currentUser.name,
        resolveText
      );
      setShowResolveModal(false);
      setShowDetail(false);
      setResolveText("");
    }
  };

  const getRelatedApplications = (conflict: Conflict) => {
    return applications.filter((a) =>
      conflict.relatedApplicationIds.includes(a.id)
    );
  };

  const getRecommendedAction = (conflict: Conflict, apps: RehearsalApplication[]) => {
    if (conflict.type === "time_overlap" || conflict.type === "teacher_conflict") {
      if (apps.length >= 2) {
        const scored = apps.map((a) => ({ app: a, score: calculatePriorityScore(a) }));
        scored.sort((a, b) => b.score - a.score);
        return {
          type: conflict.type,
          recommendations: scored.map((item, idx) => ({
            app: item.app,
            score: item.score,
            action: idx === 0 ? "批准高优先级申请" : "建议改期",
          })),
        };
      }
    }
    if (conflict.type === "capacity_exceeded") {
      return {
        type: conflict.type,
        globalAction: "调整人数或更换更大场地",
      };
    }
    if (conflict.type === "equipment_conflict") {
      return {
        type: conflict.type,
        globalAction: "协调设备使用时段",
      };
    }
    return { type: conflict.type };
  };

  const handleQuickApprove = (appId: string) => {
    approveApplication(appId, currentUser.name);
  };

  const handleQuickReject = (appId: string) => {
    rejectApplication(appId, "冲突处理-自动驳回", currentUser.name);
  };

  const handleQuickReschedule = (appId: string) => {
    rescheduleApplication(appId, "冲突处理-建议改期调整", currentUser.name);
  };

  const conflictTypeFilters = [
    { id: "all" as const, label: "全部冲突" },
    { id: "time_overlap" as const, label: "时间重叠" },
    { id: "capacity_exceeded" as const, label: "人数超载" },
    { id: "equipment_conflict" as const, label: "器材撞车" },
    { id: "teacher_conflict" as const, label: "老师冲突" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-800">冲突处理</h2>
        <p className="text-sm text-slate-500 mt-1">
          统一管理各类资源冲突，及时协调解决
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-danger-500" />
          <span className="text-sm text-slate-600">
            待处理 <span className="font-bold text-danger-600">{pendingConflicts.length}</span> 个
          </span>
        </div>
      </div>
    </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            {conflictTypeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterType === filter.id
                    ? "bg-primary-500 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-danger-500 mr-2 animate-pulse" />
              待处理冲突
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({pendingConflicts.length})
              </span>
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-thin">
              {pendingConflicts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success-400" />
                  <p>暂无待处理冲突</p>
                </div>
              ) : (
                pendingConflicts.map((conflict) => {
                  const Icon = typeIcons[conflict.type];
                  return (
                    <div
                      key={conflict.id}
                      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => openDetail(conflict)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            conflict.severity === "high"
                              ? "bg-danger-50 text-danger-600"
                              : conflict.severity === "medium"
                              ? "bg-warning-50 text-warning-600"
                              : "bg-primary-50 text-primary-600"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-800">
                              {CONFLICT_TYPE_LABELS[conflict.type]}
                            </span>
                            <ConflictBadge
                              severity={conflict.severity}
                              pulse
                              size="sm"
                            />
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {conflict.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {conflict.relatedApplicationNames.map(
                              (name, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                                >
                                  {name}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-success-500 mr-2" />
            已解决冲突
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({resolvedConflicts.length})
            </span>
          </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-thin">
              {resolvedConflicts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>暂无已解决冲突</p>
                </div>
              ) : (
                resolvedConflicts.map((conflict) => {
                const Icon = typeIcons[conflict.type];
                return (
                  <div
                    key={conflict.id}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors opacity-70"
                    onClick={() => openDetail(conflict)}
                  >
                    <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-700">
                          {CONFLICT_TYPE_LABELS[conflict.type]}
                        </span>
                        <span className="text-xs text-success-600 bg-success-50 px-2 py-0.5 rounded">
                          已解决
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {conflict.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Modal
        isOpen={showDetail && !!selectedConflict}
        onClose={() => setShowDetail(false)}
        title="冲突详情"
        size="lg"
      >
        {selectedConflict && (() => {
          const relatedApps = getRelatedApplications(selectedConflict);
          const recommendation = getRecommendedAction(selectedConflict, relatedApps);

          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    selectedConflict.severity === "high"
                      ? "bg-danger-50 text-danger-600"
                      : selectedConflict.severity === "medium"
                      ? "bg-warning-50 text-warning-600"
                      : "bg-primary-50 text-primary-600"
                  }`}
                >
                  {(() => {
                    const Icon = typeIcons[selectedConflict.type];
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {CONFLICT_TYPE_LABELS[selectedConflict.type]}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <ConflictBadge severity={selectedConflict.severity} size="sm" />
                    <StatusBadge
                      status={
                        selectedConflict.status === "pending"
                          ? "pending"
                          : "approved"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  冲突描述
                </h4>
                <p className="text-slate-600 text-sm">
                  {selectedConflict.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  涉及申请 ({relatedApps.length})
                </h4>
                <div className="space-y-3">
                  {relatedApps.map((app) => {
                    const priorityScore = calculatePriorityScore(app);
                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">
                                {app.activityName}
                              </span>
                              <ActivityLevelBadge level={app.activityLevel} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={app.status} />
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">
                                <Star className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">{priorityScore}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{app.clubName}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.venueName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateDisplay(app.date)} {app.startTime}-{app.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.equipmentNames.length > 0 ? app.equipmentNames.join("、") : "无器材"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.teacherName || "无指导老师"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <UserRound className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.participantCount} 人</span>
                            </div>
                          </div>
                        </div>
                        {selectedConflict.status === "pending" && app.status === "pending" && (
                          <div className="flex border-t border-slate-100">
                            <button
                              onClick={() => handleQuickApprove(app.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-success-600 hover:bg-success-50 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              批准
                            </button>
                            <button
                              onClick={() => handleQuickReject(app.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors border-x border-slate-100"
                            >
                              <X className="w-3.5 h-3.5" />
                              驳回
                            </button>
                            <button
                              onClick={() => handleQuickReschedule(app.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              改期
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedConflict.status === "pending" && (
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary-600" />
                    <h4 className="text-sm font-medium text-primary-700">推荐处理</h4>
                  </div>
                  {"recommendations" in recommendation && recommendation.recommendations ? (
                    <div className="space-y-2">
                      {recommendation.recommendations.map((rec) => (
                        <div key={rec.app.id} className="flex items-center justify-between bg-white rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-700 font-medium">{rec.app.activityName}</span>
                            <Badge variant="warning">
                              <Star className="w-3 h-3 mr-0.5" />{rec.score}分
                            </Badge>
                          </div>
                          <span className={`text-xs font-medium ${rec.action === "批准高优先级申请" ? "text-success-600" : "text-primary-600"}`}>
                            {rec.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : "globalAction" in recommendation && recommendation.globalAction ? (
                    <p className="text-sm text-primary-700">{recommendation.globalAction}</p>
                  ) : null}
                </div>
              )}

              {selectedConflict.status === "resolved" && (
                <div className="bg-success-50 rounded-lg p-4 border border-success-100 space-y-3">
                  <h4 className="text-sm font-medium text-success-700">
                    解决方案
                  </h4>
                  <p className="text-success-600 text-sm">
                    {selectedConflict.resolution}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-success-500 pt-1 border-t border-success-100">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      处理人：{selectedConflict.resolver}
                    </span>
                    {selectedConflict.resolvedAt && (
                      <span className="flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        处理时间：{formatDateDisplay(selectedConflict.resolvedAt)} {new Date(selectedConflict.resolvedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {selectedConflict.status === "pending" && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetail(false)}
                  >
                    忽略
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedConflict(selectedConflict);
                      setShowResolveModal(true);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    标记已解决
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="解决冲突"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            请填写解决方案，记录此次冲突的处理方式和结果。
          </p>
          <textarea
            value={resolveText}
            onChange={(e) => setResolveText(e.target.value)}
            placeholder="请输入解决方案..."
            className="w-full h-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowResolveModal(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleResolve}
              disabled={!resolveText}
            >
              确认解决
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Conflicts;
