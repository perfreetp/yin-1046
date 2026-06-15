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
import { sortApplications } from "@/utils/conflictUtils";

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

  getApplicationsByStatus: (status: ApplicationStatus) => RehearsalApplication[];
  getPendingApplications: () => RehearsalApplication[];
  getTodayApplications: () => RehearsalApplication[];
  getApplicationsByDate: (date: string) => RehearsalApplication[];
  getApplicationsByVenue: (venueId: string) => RehearsalApplication[];
  getApplicationById: (id: string) => RehearsalApplication | undefined;

  approveApplication: (id: string, approver: string) => void;
  rejectApplication: (id: string, reason: string, approver: string) => void;
  rescheduleApplication: (
    id: string,
    suggestion: string,
    approver: string
  ) => void;
  addApplication: (app: Omit<RehearsalApplication, "id" | "createdAt" | "status" | "changeHistory">) => void;

  getPendingConflicts: () => Conflict[];
  getConflictById: (id: string) => Conflict | undefined;
  resolveConflict: (id: string, resolver: string, resolution: string) => void;

  getUnreadNotifications: () => Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  addBlockedPeriod: (period: Omit<BlockedPeriod, "id" | "createdAt">) => void;
  removeBlockedPeriod: (id: string) => void;

  addChangeRecord: (appId: string, record: Omit<ChangeRecord, "id" | "timestamp">) => void;
}

export const useStore = create<AppState>((set, get) => ({
  applications: mockApplications,
  conflicts: mockConflicts,
  notifications: mockNotifications,
  venues: venues,
  equipmentList: equipmentList,
  teachers: teachers,
  clubs: clubs,
  blockedPeriods: mockBlockedPeriods,
  currentUser: {
    id: "admin1",
    name: "场馆管理王老师",
    role: "admin",
  },

  getApplicationsByStatus: (status) => {
    return get().applications.filter((a) => a.status === status);
  },

  getPendingApplications: () => {
    const pending = get().applications.filter((a) => a.status === "pending");
    return sortApplications(pending);
  },

  getTodayApplications: () => {
    const today = new Date().toISOString().split("T")[0];
    return get()
      .applications.filter((a) => a.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  getApplicationsByDate: (date) => {
    return get()
      .applications.filter((a) => a.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  getApplicationsByVenue: (venueId) => {
    return get()
      .applications.filter((a) => a.venueId === venueId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  },

  getApplicationById: (id) => {
    return get().applications.find((a) => a.id === id);
  },

  approveApplication: (id, approver) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "approved" as ApplicationStatus,
              approvedAt: new Date().toISOString(),
              approver,
              changeHistory: [
                ...app.changeHistory,
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
          : app
      ),
    }));
  },

  rejectApplication: (id, reason, approver) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "rejected" as ApplicationStatus,
              approvedAt: new Date().toISOString(),
              approver,
              rejectReason: reason,
              changeHistory: [
                ...app.changeHistory,
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
          : app
      ),
    }));
  },

  rescheduleApplication: (id, suggestion, approver) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "rescheduled" as ApplicationStatus,
              approvedAt: new Date().toISOString(),
              approver,
              rescheduleSuggestion: suggestion,
              changeHistory: [
                ...app.changeHistory,
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
          : app
      ),
    }));
  },

  addApplication: (app) => {
    const newApp: RehearsalApplication = {
      ...app,
      id: `app_${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      changeHistory: [],
    };
    set((state) => ({
      applications: [...state.applications, newApp],
    }));
  },

  getPendingConflicts: () => {
    return get().conflicts.filter((c) => c.status === "pending");
  },

  getConflictById: (id) => {
    return get().conflicts.find((c) => c.id === id);
  },

  resolveConflict: (id, resolver, resolution) => {
    set((state) => ({
      conflicts: state.conflicts.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "resolved",
              resolvedAt: new Date().toISOString(),
              resolver,
              resolution,
            }
          : c
      ),
    }));
  },

  getUnreadNotifications: () => {
    return get().notifications.filter((n) => !n.isRead);
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  addBlockedPeriod: (period) => {
    const newPeriod: BlockedPeriod = {
      ...period,
      id: `b_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      blockedPeriods: [...state.blockedPeriods, newPeriod],
    }));
  },

  removeBlockedPeriod: (id) => {
    set((state) => ({
      blockedPeriods: state.blockedPeriods.filter((p) => p.id !== id),
    }));
  },

  addChangeRecord: (appId, record) => {
    set((state) => ({
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
    }));
  },
}));
