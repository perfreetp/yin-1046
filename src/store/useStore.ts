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
  notifications as mockNotifications,
  blockedPeriods as mockBlockedPeriods,
} from "@/data/applications";
import { detectAllConflicts } from "@/utils/conflictUtils";

const STORAGE_KEY = "rehearsal_platform_state";

interface ResolvedConflictRecord {
  signature: string;
  resolver: string;
  resolution: string;
  resolvedAt: string;
}

interface PersistedData {
  applications: RehearsalApplication[];
  notifications: Notification[];
  blockedPeriods: BlockedPeriod[];
  resolvedSignatures: string[];
  resolvedConflictRecords: ResolvedConflictRecord[];
}

function loadPersistedState(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        applications: parsed.applications || mockApplications,
        notifications: parsed.notifications || mockNotifications,
        blockedPeriods: parsed.blockedPeriods || mockBlockedPeriods,
        resolvedSignatures: parsed.resolvedSignatures || [],
        resolvedConflictRecords: parsed.resolvedConflictRecords || [],
      };
    }
  } catch {
    /* empty */
  }
  return null;
}

function persistState(data: PersistedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* empty */
  }
}

const persisted = loadPersistedState();

const initialApplications = persisted?.applications ?? mockApplications;
const initialResolvedSignatures = new Set(persisted?.resolvedSignatures ?? []);
const initialResolvedRecords = new Map<string, ResolvedConflictRecord>();
(persisted?.resolvedConflictRecords ?? []).forEach((r: ResolvedConflictRecord) => {
  initialResolvedRecords.set(r.signature, r);
});

const initialConflicts = detectAllConflicts(
  initialApplications,
  venues,
  equipmentList
).map((c) => {
  if (initialResolvedSignatures.has(c.signature)) {
    const record = initialResolvedRecords.get(c.signature);
    return {
      ...c,
      status: "resolved" as const,
      resolver: record?.resolver || "",
      resolution: record?.resolution || "",
      resolvedAt: record?.resolvedAt || "",
    };
  }
  return c;
});

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

function buildConflicts(
  applications: RehearsalApplication[],
  venuesList: Venue[],
  equipmentListData: Equipment[],
  resolvedSigs: Set<string>,
  resolvedRecords: Map<string, ResolvedConflictRecord>
): Conflict[] {
  return detectAllConflicts(applications, venuesList, equipmentListData).map(
    (c) => {
      if (resolvedSigs.has(c.signature)) {
        const record = resolvedRecords.get(c.signature);
        return {
          ...c,
          status: "resolved" as const,
          resolver: record?.resolver || "",
          resolution: record?.resolution || "",
          resolvedAt: record?.resolvedAt || "",
        };
      }
      return c;
    }
  );
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
  resolvedSignatures: Set<string>;
  resolvedConflictRecords: Map<string, ResolvedConflictRecord>;
  currentUser: {
    id: string;
    name: string;
    role: "admin" | "club" | "teacher";
  };

  addApplication: (
    app: Omit<RehearsalApplication, "id" | "createdAt" | "status" | "changeHistory">
  ) => void;
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

function doPersist(
  state: AppState & { resolvedConflictRecords: Map<string, ResolvedConflictRecord> }
) {
  const data: PersistedData = {
    applications: state.applications,
    notifications: state.notifications,
    blockedPeriods: state.blockedPeriods,
    resolvedSignatures: Array.from(state.resolvedSignatures),
    resolvedConflictRecords: Array.from(state.resolvedConflictRecords.values()),
  };
  persistState(data);
}

export const useStore = create<AppState>((set, get) => ({
  applications: initialApplications,
  conflicts: initialConflicts,
  notifications: persisted?.notifications ?? mockNotifications,
  venues: venues,
  equipmentList: equipmentList,
  teachers: teachers,
  clubs: clubs,
  blockedPeriods: persisted?.blockedPeriods ?? mockBlockedPeriods,
  resolvedSignatures: initialResolvedSignatures,
  resolvedConflictRecords: initialResolvedRecords,
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
      const newConflicts = buildConflicts(
        newApplications, state.venues, state.equipmentList,
        state.resolvedSignatures, state.resolvedConflictRecords
      );
      const s = { ...state, applications: newApplications, conflicts: newConflicts };
      doPersist(s as any);
      return { applications: newApplications, conflicts: newConflicts };
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
      const newConflicts = buildConflicts(
        newApplications, state.venues, state.equipmentList,
        state.resolvedSignatures, state.resolvedConflictRecords
      );
      const newNotifications = addNotification(
        state.notifications, "approval", app.clubId, app.clubName,
        "排练申请已批准",
        `您提交的「${app.activityName}」申请已通过审批。\n\n场地：${app.venueName}\n时间：${app.date} ${app.startTime}-${app.endTime}\n\n请按时到场排练，排练结束后及时关闭设备电源。`,
        app.id
      );
      const s = { ...state, applications: newApplications, conflicts: newConflicts, notifications: newNotifications };
      doPersist(s as any);
      return { applications: newApplications, conflicts: newConflicts, notifications: newNotifications };
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
      const newConflicts = buildConflicts(
        newApplications, state.venues, state.equipmentList,
        state.resolvedSignatures, state.resolvedConflictRecords
      );
      const newNotifications = addNotification(
        state.notifications, "rejection", app.clubId, app.clubName,
        "排练申请已驳回",
        `您提交的「${app.activityName}」申请已被驳回。\n\n原因：${reason}\n\n如有疑问，请联系场馆管理办公室。`,
        app.id
      );
      const s = { ...state, applications: newApplications, conflicts: newConflicts, notifications: newNotifications };
      doPersist(s as any);
      return { applications: newApplications, conflicts: newConflicts, notifications: newNotifications };
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
      const newConflicts = buildConflicts(
        newApplications, state.venues, state.equipmentList,
        state.resolvedSignatures, state.resolvedConflictRecords
      );
      const newNotifications = addNotification(
        state.notifications, "reschedule", app.clubId, app.clubName,
        "排练申请建议改期",
        `您提交的「${app.activityName}」申请建议改期。\n\n原因/建议：${suggestion}\n\n请登录系统确认或重新提交申请。`,
        app.id
      );
      const s = { ...state, applications: newApplications, conflicts: newConflicts, notifications: newNotifications };
      doPersist(s as any);
      return { applications: newApplications, conflicts: newConflicts, notifications: newNotifications };
    });
  },

  resolveConflict: (id, resolver, resolution) => {
    set((state) => {
      const conflict = state.conflicts.find((c) => c.id === id);
      if (!conflict) return state;
      const newResolvedSigs = new Set(state.resolvedSignatures);
      newResolvedSigs.add(conflict.signature);
      const newResolvedRecords = new Map(state.resolvedConflictRecords);
      const now = new Date().toISOString();
      newResolvedRecords.set(conflict.signature, {
        signature: conflict.signature,
        resolver,
        resolution,
        resolvedAt: now,
      });
      const newConflicts = state.conflicts.map((c) =>
        c.id === id
          ? { ...c, status: "resolved" as const, resolvedAt: now, resolver, resolution }
          : c
      );
      const s = { ...state, conflicts: newConflicts, resolvedSignatures: newResolvedSigs, resolvedConflictRecords: newResolvedRecords };
      doPersist(s as any);
      return { conflicts: newConflicts, resolvedSignatures: newResolvedSigs, resolvedConflictRecords: newResolvedRecords };
    });
  },

  markNotificationRead: (id) => {
    set((state) => {
      const newNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const s = { ...state, notifications: newNotifications };
      doPersist(s as any);
      return { notifications: newNotifications };
    });
  },

  markAllNotificationsRead: () => {
    set((state) => {
      const newNotifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      const s = { ...state, notifications: newNotifications };
      doPersist(s as any);
      return { notifications: newNotifications };
    });
  },

  addBlockedPeriod: (period) => {
    const newPeriod: BlockedPeriod = {
      ...period,
      id: `b_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const newBlockedPeriods = [...state.blockedPeriods, newPeriod];
      const s = { ...state, blockedPeriods: newBlockedPeriods };
      doPersist(s as any);
      return { blockedPeriods: newBlockedPeriods };
    });
  },

  removeBlockedPeriod: (id) => {
    set((state) => {
      const newBlockedPeriods = state.blockedPeriods.filter((p) => p.id !== id);
      const s = { ...state, blockedPeriods: newBlockedPeriods };
      doPersist(s as any);
      return { blockedPeriods: newBlockedPeriods };
    });
  },

  addChangeRecord: (appId, record) => {
    set((state) => {
      const newApplications = state.applications.map((app) =>
        app.id === appId
          ? {
              ...app,
              changeHistory: [
                ...app.changeHistory,
                { ...record, id: `ch_${Date.now()}`, timestamp: new Date().toISOString() },
              ],
            }
          : app
      );
      const s = { ...state, applications: newApplications };
      doPersist(s as any);
      return { applications: newApplications };
    });
  },
}));
