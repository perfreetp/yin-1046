import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Plus,
  FileCheck,
  Users,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatCard from "@/components/business/StatCard";
import StatusBadge from "@/components/business/StatusBadge";
import ActivityLevelBadge from "@/components/business/ActivityLevelBadge";
import ConflictBadge from "@/components/business/ConflictBadge";
import { useStore } from "@/store/useStore";
import { getDateLabel, formatDateDisplay } from "@/utils/dateUtils";
import { sortApplications } from "@/utils/conflictUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const applications = useStore((state) => state.applications);
  const conflicts = useStore((state) => state.conflicts);
  const venues = useStore((state) => state.venues);

  const todayApplications = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return applications
      .filter((a) => a.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [applications]);

  const pendingApplications = useMemo(() => {
    const pending = applications.filter((a) => a.status === "pending");
    return sortApplications(pending);
  }, [applications]);

  const pendingConflicts = useMemo(() => {
    return conflicts.filter((c) => c.status === "pending");
  }, [conflicts]);

  const approvedToday = todayApplications.filter(
    (a) => a.status === "approved"
  ).length;
  const totalVenues = venues.length;

  const utilizationRate = Math.round(
    (approvedToday / totalVenues) * 100
  );

  const highSeverityConflicts = pendingConflicts.filter(
    (c) => c.severity === "high"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">总览看板</h2>
          <p className="text-sm text-slate-500 mt-1">
            {getDateLabel(new Date().toISOString().split("T")[0])} · 排练资源调度总览
          </p>
        </div>
        <Button onClick={() => navigate("/approvals")}>
          <Plus className="w-4 h-4 mr-2" />
          新建申请
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日排练"
          value={todayApplications.length}
          icon={CalendarCheck}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="待审批申请"
          value={pendingApplications.length}
          icon={FileCheck}
          color="warning"
          trend={{ value: 8, isUp: true }}
        />
        <StatCard
          title="待处理冲突"
          value={pendingConflicts.length}
          icon={AlertTriangle}
          color="danger"
          trend={{ value: 3, isUp: false }}
        />
        <StatCard
          title="场地使用率"
          value={`${utilizationRate}%`}
          icon={TrendingUp}
          color="success"
          trend={{ value: 5, isUp: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>今日排期时间轴</Card.Title>
              <button
                onClick={() => navigate("/resources")}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                查看全部 <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </Card.Header>
            <Card.Body>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-4">
                  {todayApplications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>今日暂无排练安排</p>
                    </div>
                  ) : (
                    todayApplications.map((app) => (
                      <div
                        key={app.id}
                        className="relative flex items-start pl-14"
                      >
                        <div
                          className={`absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${
                            app.status === "approved"
                              ? "bg-success-500"
                              : app.status === "pending"
                              ? "bg-warning-500"
                              : "bg-slate-400"
                          }`}
                        />
                        <div className="flex-1 bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-800">
                                {app.activityName}
                              </p>
                              <p className="text-sm text-slate-500 mt-0.5">
                                {app.startTime} - {app.endTime} · {app.venueName}
                              </p>
                            </div>
                            <StatusBadge status={app.status} />
                          </div>
                          <div className="flex items-center mt-3 gap-2 flex-wrap">
                            <ActivityLevelBadge level={app.activityLevel} />
                            <span className="text-xs text-slate-500 flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1" />
                              {app.participantCount}人
                            </span>
                            <span className="text-xs text-slate-500">
                              {app.clubName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="space-y-6">
          {highSeverityConflicts > 0 && (
            <Card className="border-danger-200 bg-danger-50/50">
              <Card.Header className="border-b-danger-100">
                <Card.Title className="text-danger-700 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  冲突预警
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-danger-600 mb-4">
                  当前有 <span className="font-bold">{highSeverityConflicts}</span> 个严重冲突需要处理
                </p>
                <div className="space-y-2">
                  {pendingConflicts
                    .filter((c) => c.severity === "high")
                    .slice(0, 2)
                    .map((conflict) => (
                      <div
                        key={conflict.id}
                        className="bg-white rounded-lg p-3 border border-danger-100"
                      >
                        <ConflictBadge severity={conflict.severity} pulse size="sm" />
                        <p className="text-sm text-slate-700 mt-2">
                          {conflict.description}
                        </p>
                      </div>
                    ))}
                </div>
                <Button
                  variant="danger"
                  className="w-full mt-4"
                  size="sm"
                  onClick={() => navigate("/conflicts")}
                >
                  前往处理冲突
                </Button>
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Header>
              <Card.Title>待审批申请</Card.Title>
              <button
                onClick={() => navigate("/approvals")}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                全部审批 <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="divide-y divide-slate-100">
                {pendingApplications.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    className="px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate("/approvals")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {app.activityName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDateDisplay(app.date)} · {app.venueName}
                        </p>
                      </div>
                      <ActivityLevelBadge level={app.activityLevel} />
                    </div>
                  </div>
                ))}
                {pendingApplications.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    暂无待审批申请
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>快捷操作</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex-col h-20"
                  onClick={() => navigate("/approvals")}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-xs">新建申请</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-20"
                  onClick={() => navigate("/statistics")}
                >
                  <TrendingUp className="w-5 h-5 mb-1" />
                  <span className="text-xs">查看报表</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-20"
                  onClick={() => navigate("/resources")}
                >
                  <CalendarCheck className="w-5 h-5 mb-1" />
                  <span className="text-xs">资源排期</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-20"
                  onClick={() => navigate("/settings")}
                >
                  <AlertTriangle className="w-5 h-5 mb-1" />
                  <span className="text-xs">通知设置</span>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
