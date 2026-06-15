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
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConflictBadge from "@/components/business/ConflictBadge";
import StatusBadge from "@/components/business/StatusBadge";
import {
  Conflict,
  ConflictType,
  ConflictSeverity,
  CONFLICT_TYPE_LABELS,
} from "@/types";
import { useStore } from "@/store/useStore";
import { formatDateDisplay } from "@/utils/dateUtils";

type FilterType = "all" | ConflictType;

const Conflicts = () => {
  const conflicts = useStore((state) => state.conflicts);
  const applications = useStore((state) => state.applications);
  const resolveConflict = useStore((state) => state.resolveConflict);
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
        {selectedConflict && (
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
                  <ConflictBadge severity={selectedConflict.severity} />
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
              涉及申请 ({selectedConflict.relatedApplicationIds.length})
            </h4>
              <div className="space-y-2">
                {getRelatedApplications(selectedConflict).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {app.activityName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {app.clubName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {formatDateDisplay(app.date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {app.startTime} - {app.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedConflict.status === "resolved" && (
              <div className="bg-success-50 rounded-lg p-4 border border-success-100">
              <h4 className="text-sm font-medium text-success-700 mb-2">
                解决方案
              </h4>
              <p className="text-success-600 text-sm">
                {selectedConflict.resolution}
              </p>
              <p className="text-xs text-success-500 mt-2">
                处理人：{selectedConflict.resolver}
              </p>
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
        )}
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
