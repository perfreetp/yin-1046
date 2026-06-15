import { useState } from "react";
import {
  Building2,
  Package,
  UserCheck,
  CalendarX,
  Clock,
  Users,
  MapPin,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useStore } from "@/store/useStore";
import {
  getWeekDates,
  formatDateDisplay,
  getWeekdayName,
  parseTime,
} from "@/utils/dateUtils";
import { Venue, Equipment, Teacher, BlockedPeriod } from "@/types";

type TabType = "venues" | "equipment" | "teachers" | "blocked";

const Resources = () => {
  const venues = useStore((state) => state.venues);
  const equipmentList = useStore((state) => state.equipmentList);
  const teachers = useStore((state) => state.teachers);
  const blockedPeriods = useStore((state) => state.blockedPeriods);
  const applications = useStore((state) => state.applications);
  const removeBlockedPeriod = useStore(
    (state) => state.removeBlockedPeriod
  );
  const addBlockedPeriod = useStore((state) => state.addBlockedPeriod);
  const currentUser = useStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState<TabType>("venues");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVenueDetail, setShowVenueDetail] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [newBlocked, setNewBlocked] = useState({
    venueId: "",
    date: "",
    startTime: "08:00",
    endTime: "22:00",
    reason: "",
  });

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);

  const tabs = [
    { id: "venues" as TabType, label: "场地排期", icon: Building2 },
    { id: "equipment" as TabType, label: "设备排期", icon: Package },
    { id: "teachers" as TabType, label: "老师排期", icon: UserCheck },
    { id: "blocked" as TabType, label: "封场管理", icon: CalendarX },
  ];

  const getVenueSchedule = (venueId: string, date: string) => {
    return applications.filter(
      (a) => a.venueId === venueId && a.date === date && (a.status === "approved" || a.status === "pending")
    );
  };

  const getEquipmentSchedule = (eqId: string, date: string) => {
    return applications.filter(
      (a) => a.equipmentIds.includes(eqId) && a.date === date && (a.status === "approved" || a.status === "pending")
    );
  };

  const getTeacherSchedule = (teacherId: string, date: string) => {
    return applications.filter(
      (a) => a.teacherId === teacherId && a.date === date && (a.status === "approved" || a.status === "pending")
    );
  };

  const getBlockedForVenue = (venueId: string, date: string) => {
    return blockedPeriods.filter((b) => b.venueId === venueId && b.date === date);
  };

  const getTimeSlotStyle = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const dayStart = 8 * 60;
    const dayEnd = 22 * 60;
    const totalMinutes = dayEnd - dayStart;

    const left = ((start - dayStart) / totalMinutes) * 100;
    const width = ((end - start) / totalMinutes) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const openVenueDetail = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueDetail(true);
  };

  const handleAddBlocked = () => {
    if (newBlocked.venueId && newBlocked.date && newBlocked.reason) {
      const venue = venues.find((v) => v.id === newBlocked.venueId);
      addBlockedPeriod({
        venueId: newBlocked.venueId,
        venueName: venue?.name || "",
        date: newBlocked.date,
        startTime: newBlocked.startTime,
        endTime: newBlocked.endTime,
        reason: newBlocked.reason,
        createdBy: currentUser.name,
      });
      setShowBlockedModal(false);
      setNewBlocked({
        venueId: "",
        date: "",
        startTime: "08:00",
        endTime: "22:00",
        reason: "",
      });
    }
  };

  const weekNav = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setWeekOffset(weekOffset - 1)}
        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">
        {formatDateDisplay(weekDates[0])} - {formatDateDisplay(weekDates[6])}
      </span>
      <button
        onClick={() => setWeekOffset(weekOffset + 1)}
        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const legendApproved = (
    <span className="flex items-center gap-1">
      <span className="w-3 h-3 rounded bg-success-500" />
      已批准
    </span>
  );
  const legendPending = (
    <span className="flex items-center gap-1">
      <span className="w-3 h-3 rounded bg-warning-500" />
      待审批
    </span>
  );

  const renderWeekHeader = () => (
    <div className="flex border-b border-slate-200">
      <div className="w-32 flex-shrink-0 p-3 text-sm font-medium text-slate-600">
        资源
      </div>
      <div className="flex-1 flex">
        {weekDates.map((date) => (
          <div key={date} className="flex-1 p-3 text-center">
            <p className="text-sm font-medium text-slate-700">
              {getWeekdayName(date)}
            </p>
            <p className="text-xs text-slate-500">{date.slice(5)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">资源库</h2>
          <p className="text-sm text-slate-500 mt-1">
            场地、设备、老师统一管理，透明化资源占用情况
          </p>
        </div>
        {activeTab === "blocked" && (
          <Button onClick={() => setShowBlockedModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加封场
          </Button>
        )}
      </div>

      <Card>
        <Card.Header className="pb-0">
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Card.Header>
        <Card.Body>
          {activeTab === "venues" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {weekNav}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {legendApproved}
                  {legendPending}
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-danger-500" />
                    封场
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {renderWeekHeader()}
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openVenueDetail(venue)}
                    >
                      <div className="w-32 flex-shrink-0 p-3">
                        <p className="text-sm font-medium text-slate-700">{venue.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {venue.type} · {venue.capacity}人
                        </p>
                      </div>
                      <div className="flex-1 flex">
                        {weekDates.map((date) => (
                          <div key={date} className="flex-1 p-2 relative h-12 border-l border-slate-100">
                            {getVenueSchedule(venue.id, date).map((app) => (
                              <div
                                key={app.id}
                                className={`absolute top-2 bottom-2 rounded text-white text-xs px-1.5 overflow-hidden whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity ${
                                  app.status === "approved" ? "bg-success-500/80" : "bg-warning-500/80"
                                }`}
                                style={getTimeSlotStyle(app.startTime, app.endTime)}
                                title={`${app.activityName}\n${app.startTime}-${app.endTime}\n${app.clubName}`}
                              >
                                {app.activityName.slice(0, 4)}
                              </div>
                            ))}
                            {getBlockedForVenue(venue.id, date).map((blocked) => (
                              <div
                                key={blocked.id}
                                className="absolute top-2 bottom-2 bg-danger-500/80 rounded text-white text-xs px-1.5 overflow-hidden whitespace-nowrap"
                                style={getTimeSlotStyle(blocked.startTime, blocked.endTime)}
                                title={`封场：${blocked.reason}\n${blocked.startTime}-${blocked.endTime}`}
                              >
                                封场
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {weekNav}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {legendApproved}
                  {legendPending}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {renderWeekHeader()}
                  {equipmentList.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex border-b border-slate-100 hover:bg-slate-50"
                    >
                      <div className="w-32 flex-shrink-0 p-3">
                        <p className="text-sm font-medium text-slate-700">{eq.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {eq.category} · {eq.totalQuantity}件
                        </p>
                      </div>
                      <div className="flex-1 flex">
                        {weekDates.map((date) => {
                          const schedule = getEquipmentSchedule(eq.id, date);
                          return (
                            <div key={date} className="flex-1 p-2 relative h-12 border-l border-slate-100">
                              {schedule.length === 0 && (
                                <div className="absolute inset-2 flex items-center justify-center text-xs text-slate-300">
                                  空
                                </div>
                              )}
                              {schedule.map((app) => (
                                <div
                                  key={app.id}
                                  className={`absolute top-2 bottom-2 rounded text-white text-xs px-1.5 overflow-hidden whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity ${
                                    app.status === "approved" ? "bg-success-500/80" : "bg-warning-500/80"
                                  }`}
                                  style={getTimeSlotStyle(app.startTime, app.endTime)}
                                  title={`${app.activityName}\n${app.startTime}-${app.endTime}\n${app.clubName} · ${app.venueName}`}
                                >
                                  {app.clubName.slice(0, 3)}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "teachers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {weekNav}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {legendApproved}
                  {legendPending}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {renderWeekHeader()}
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex border-b border-slate-100 hover:bg-slate-50"
                    >
                      <div className="w-32 flex-shrink-0 p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{teacher.name}</p>
                            <p className="text-xs text-slate-400">{teacher.expertise}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        {weekDates.map((date) => {
                          const schedule = getTeacherSchedule(teacher.id, date);
                          return (
                            <div key={date} className="flex-1 p-2 relative h-12 border-l border-slate-100">
                              {schedule.length === 0 && (
                                <div className="absolute inset-2 flex items-center justify-center text-xs text-slate-300">
                                  空
                                </div>
                              )}
                              {schedule.map((app) => (
                                <div
                                  key={app.id}
                                  className={`absolute top-2 bottom-2 rounded text-white text-xs px-1.5 overflow-hidden whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity ${
                                    app.status === "approved" ? "bg-success-500/80" : "bg-warning-500/80"
                                  }`}
                                  style={getTimeSlotStyle(app.startTime, app.endTime)}
                                  title={`${app.activityName}\n${app.startTime}-${app.endTime}\n${app.clubName} · ${app.venueName}`}
                                >
                                  {app.activityName.slice(0, 4)}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "blocked" && (
            <div className="space-y-3">
              {blockedPeriods.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarX className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无封场安排</p>
                </div>
              ) : (
                blockedPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-4 bg-danger-50 rounded-lg border border-danger-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
                        <CalendarX className="w-5 h-5 text-danger-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {period.venueName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDateDisplay(period.date)} · {period.startTime} -{" "}
                          {period.endTime}
                        </p>
                        <p className="text-xs text-danger-600 mt-1">
                          原因：{period.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        创建人：{period.createdBy}
                      </span>
                      <button
                        onClick={() => removeBlockedPeriod(period.id)}
                        className="p-2 text-danger-600 hover:bg-danger-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        isOpen={showVenueDetail && !!selectedVenue}
        onClose={() => setShowVenueDetail(false)}
        title="场地详情"
        size="lg"
      >
        {selectedVenue && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedVenue.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="primary">{selectedVenue.type}</Badge>
                <span className="text-sm text-slate-500 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  容量 {selectedVenue.capacity} 人
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedVenue.building}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                配套设施
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedVenue.facilities.map((f, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                本周排期
              </h4>
              <div className="space-y-2">
                {weekDates.map((date) => {
                  const schedule = getVenueSchedule(selectedVenue.id, date);
                  const blocked = getBlockedForVenue(selectedVenue.id, date);
                  return (
                    <div key={date} className="flex items-start gap-3">
                      <div className="w-24 text-sm text-slate-500 flex-shrink-0 pt-1">
                        {getWeekdayName(date)}
                        <br />
                        <span className="text-xs text-slate-400">
                          {date.slice(5)}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        {schedule.length === 0 && blocked.length === 0 && (
                          <span className="text-xs text-slate-400">
                            全天空闲
                          </span>
                        )}
                        {schedule.map((app) => (
                          <div
                            key={app.id}
                            className="px-2 py-1.5 bg-success-50 rounded text-xs"
                          >
                            <span className="text-success-700 font-medium">
                              {app.startTime}-{app.endTime}
                            </span>
                            <span className="text-slate-600 ml-2">
                              {app.activityName}
                            </span>
                          </div>
                        ))}
                        {blocked.map((b) => (
                          <div
                            key={b.id}
                            className="px-2 py-1.5 bg-danger-50 rounded text-xs"
                          >
                            <span className="text-danger-700 font-medium">
                              {b.startTime}-{b.endTime}
                            </span>
                            <span className="text-danger-600 ml-2">
                              封场 - {b.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        title="添加封场"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              选择场地
            </label>
            <select
              value={newBlocked.venueId}
              onChange={(e) =>
                setNewBlocked({ ...newBlocked, venueId: e.target.value })
              }
              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">请选择场地</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              日期
            </label>
            <input
              type="date"
              value={newBlocked.date}
              onChange={(e) =>
                setNewBlocked({ ...newBlocked, date: e.target.value })
              }
              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                开始时间
              </label>
              <input
                type="time"
                value={newBlocked.startTime}
                onChange={(e) =>
                  setNewBlocked({ ...newBlocked, startTime: e.target.value })
                }
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                结束时间
              </label>
              <input
                type="time"
                value={newBlocked.endTime}
                onChange={(e) =>
                  setNewBlocked({ ...newBlocked, endTime: e.target.value })
                }
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              封场原因
            </label>
            <textarea
              value={newBlocked.reason}
              onChange={(e) =>
                setNewBlocked({ ...newBlocked, reason: e.target.value })
              }
              placeholder="请输入封场原因..."
              className="w-full h-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowBlockedModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleAddBlocked}
              disabled={
                !newBlocked.venueId || !newBlocked.date || !newBlocked.reason
              }
            >
              确认添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Resources;
