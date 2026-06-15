import { create } from "zustand";
import {
  RehearsalApplication,
  Conflict,
  Notification,
  Venue,
  Equipment,
  Teacher,
  Club,
  BlockedPeriod,
  ApplicationStatus,
  ChangeRecord,
} from "@/types";
import { venues, equipmentList, teachers, clubs } from "@/data/venues";
import {
  applications as mockApplications,
  conflicts as mockConflicts,
  notifications as mockNotifications,
  blockedPeriods as mockBlockedPeriods,
} from "@/data/applications";
import { sortApplications, detectAllConflicts } from "@/utils/conflictUtils";

const STORAGE_KEY = "rehearsal_platform_state";

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        applications: parsed.applications || mockApplications,
        conflicts: parsed.conflicts || mockConflicts,
        notifications: parsed.notifications || mockNotifications,
        blockedPeriods: parsed.blockedPeriods || mockBlockedPeriods,
      };
    }
  } catch {}
  return null;
}

function persistState(state: {
  applications: RehearsalApplication[];
  conflicts: Conflict[];
  notifications: Notification[];
  blockedPeriods: BlockedPeriod[];
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const persisted = loadPersistedState();

function addNotification(
  notifications: Notification[],
  type: "approval" | "rejection" | "reschedule" | "conflict" | "system",
  recipientId: string,
  recipientName: string,
  title: string,
  content: string,
  relatedApplicationId?: string
): Notification[] {
  return [
    ...notifications,
    {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      recipientId,
      recipientName,
      type,
      title,
      content,
      relatedApplicationId,
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function recomputeConflicts(
  applications: RehearsalApplication[],
  venuesList: Venue[],
  equipmentListData: Equipment[]
): Conflict[] {
  return detectAllConflicts(applications, venuesList, equipmentListData);
}

interface AppState {
  applications: RehearsalApplication[];
  conflicts: Conflict[];
  notifications: Notification[];
  venues: Venue[];
  equipmentList: Equipment[];
  teachers: Teacher[];
  clubs: Club[];
  blockedPeriods: BlockedPeriod[];
  currentUser: {
    id: string;
    name: string;
    role: "admin" | "club" | "teacher";
  };

  addApplication: (app: Omit<RehearsalApplication, "id" | "createdAt" | "status" | "changeHistory">) => void;
  approveApplication: (id: string, approver: string) => void;
  rejectApplication: (id: string, reason: string, approver: string) => void;
  rescheduleApplication: (id: string, suggestion: string, approver: string) => void;

  resolveConflict: (id: string, resolver: string, resolution: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  addBlockedPeriod: (period: Omit<BlockedPeriod, "id" | "createdAt">) => void;
  removeBlockedPeriod: (id: string) => void;

  addChangeRecord: (appId: string, record: Omit<ChangeRecord, "id" | "timestamp">) => void;
}

export const useStore = create<AppState>((set, get) => ({
  applications: persisted?.applications ?? mockApplications,
  conflicts: persisted?.conflicts ?? mockConflicts,
  notifications: persisted?.notifications ?? mockNotifications,
  venues: venues,
  equipmentList: equipmentList,
  teachers: teachers,
  clubs: clubs,
  blockedPeriods: persisted?.blockedPeriods ?? mockBlockedPeriods,
  currentUser: {
    id: "admin1",
    name: "场馆管理王老师",
    role: "admin",
  },

  addApplication: (app) => {
    const newApp: RehearsalApplication = {
      ...app,
      id: `app_${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      changeHistory: [
        {
          id: `ch_${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: app.clubName,
          operatorRole: "社团负责人",
          action: "提交申请",
          reason: "新建排练申请",
        },
      ],
    };
    set((state) => {
      const newApplications = [...state.applications, newApp];
      const newConflicts = recomputeConflicts(newApplications, state.venues, state.equipmentList);
      const newState = {
        applications: newApplications,
        conflicts: newConflicts,
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  approveApplication: (id, approver) => {
    set((state) => {
      const app = state.applications.find((a) => a.id === id);
      if (!app) return state;
      const newApplications = state.applications.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "approved" as ApplicationStatus,
              approvedAt: new Date().toISOString(),
              approver,
              changeHistory: [
                ...a.changeHistory,
                {
                  id: `ch_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  operator: approver,
                  operatorRole: "管理员",
                  action: "批准申请",
                  reason: "通过审批",
                },
              ],
            }
          : a
      );
      const newConflicts = recomputeConflicts(newApplications, state.venues, state.equipmentList);
      const newNotifications = addNotification(
        state.notifications,
        "approval",
        app.clubId,
        app.clubName,
        "排练申请已批准",
        `您提交的「${app.activityName}」申请已通过审批。\n\n场地：${app.venueName}\n时间：${app.date} ${app.startTime}-${app.endTime}\n\n请按时到场排练，排练结束后及时关闭设备电源。`,
        app.id
      );
      const newState = {
        applications: newApplications,
        conflicts: newConflicts,
        notifications: newNotifications,
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  rejectApplication: (id, reason, approver) => {
    set((state) => {
      const app = state.applications.find((a) => a.id === id);
      if (!app) return state;
      const newApplications = state.applications.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "rejected" as ApplicationStatus,
              approvedAt: new Date().toISOString(),
              approver,
              rejectReason: reason,
              changeHistory: [
                ...a.changeHistory,
                {
                  id: `ch_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  operator: approver,
                  operatorRole: "管理员",
                  action: "驳回申请",
                  reason,
                },
              ],
            }
          : a
      );
      const newConflicts = recomputeConflicts(newApplications, state.venues, state.equipmentList);
      const newNotifications = addNotification(
        state.notifications,
        "rejection",
        app.clubId,
        app.clubName,
        "排练申请已驳回",
        `您提交的「${app.activityName}」申请已被驳回。\n\n原因：${reason}\n\n如有疑问，请联系场馆管理办公室。`,
        app.id
      );
      const newState = {
        applications: newApplications,
        conflicts: newConflicts,
        notifications: newNotifications,
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  rescheduleApplication: (id, suggestion, approver) => {
    set((state) => {
      const app = state.applications.find((a) => a.id === id);
      if (!app) return state;
      const newApplications = state.applications.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "rescheduled" as ApplicationStatus,
              approvedAt: new Date().toISOString(),
              approver,
              rescheduleSuggestion: suggestion,
              changeHistory: [
                ...a.changeHistory,
                {
                  id: `ch_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  operator: approver,
                  operatorRole: "管理员",
                  action: "建议改期",
                  reason: suggestion,
                },
              ],
            }
          : a
      );
      const newConflicts = recomputeConflicts(newApplications, state.venues, state.equipmentList);
      const newNotifications = addNotification(
        state.notifications,
        "reschedule",
        app.clubId,
        app.clubName,
        "排练申请建议改期",
        `您提交的「${app.activityName}」申请建议改期。\n\n原因/建议：${suggestion}\n\n请登录系统确认或重新提交申请。`,
        app.id
      );
      const newState = {
        applications: newApplications,
        conflicts: newConflicts,
        notifications: newNotifications,
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  resolveConflict: (id, resolver, resolution) => {
    set((state) => {
      const newState = {
        conflicts: state.conflicts.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "resolved" as const,
                resolvedAt: new Date().toISOString(),
                resolver,
                resolution,
              }
            : c
        ),
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  markNotificationRead: (id) => {
    set((state) => {
      const newState = {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  markAllNotificationsRead: () => {
    set((state) => {
      const newState = {
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addBlockedPeriod: (period) => {
    const newPeriod: BlockedPeriod = {
      ...period,
      id: `b_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const newState = {
        blockedPeriods: [...state.blockedPeriods, newPeriod],
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  removeBlockedPeriod: (id) => {
    set((state) => {
      const newState = {
        blockedPeriods: state.blockedPeriods.filter((p) => p.id !== id),
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addChangeRecord: (appId, record) => {
    set((state) => {
      const newState = {
        applications: state.applications.map((app) =>
          app.id === appId
            ? {
                ...app,
                changeHistory: [
                  ...app.changeHistory,
                  {
                    ...record,
                    id: `ch_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : app
        ),
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },
}));
