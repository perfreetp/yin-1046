export type ActivityLevel = "school_level" | "college_level" | "daily" | "temporary";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "rescheduled"
  | "cancelled";

export type ConflictType =
  | "time_overlap"
  | "capacity_exceeded"
  | "equipment_conflict"
  | "teacher_conflict";

export type ConflictSeverity = "high" | "medium" | "low";

export type ConflictStatus = "pending" | "resolved";

export interface Venue {
  id: string;
  name: string;
  type: string;
  capacity: number;
  facilities: string[];
  isActive: boolean;
  building: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string;
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  expertise: string;
  phone: string;
}

export interface Club {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  contactPhone: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  action: string;
  reason: string;
  oldValue?: string;
  newValue?: string;
}

export interface RehearsalApplication {
  id: string;
  clubId: string;
  clubName: string;
  activityName: string;
  activityLevel: ActivityLevel;
  venueId: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  equipmentIds: string[];
  equipmentNames: string[];
  teacherId: string;
  teacherName: string;
  status: ApplicationStatus;
  remark: string;
  createdAt: string;
  approvedAt?: string;
  approver?: string;
  rejectReason?: string;
  rescheduleSuggestion?: string;
  changeHistory: ChangeRecord[];
  priorityScore?: number;
}

export interface Conflict {
  id: string;
  signature: string;
  type: ConflictType;
  description: string;
  severity: ConflictSeverity;
  relatedApplicationIds: string[];
  relatedApplicationNames: string[];
  status: ConflictStatus;
  createdAt: string;
  resolvedAt?: string;
  resolver?: string;
  resolution?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  recipientName: string;
  type: "approval" | "rejection" | "reschedule" | "conflict" | "system";
  title: string;
  content: string;
  relatedApplicationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BlockedPeriod {
  id: string;
  venueId: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface UsageStat {
  venueId: string;
  venueName: string;
  totalHours: number;
  usedHours: number;
  utilizationRate: number;
  vacancyRate: number;
}

export interface HourlyStat {
  hour: number;
  count: number;
}

export interface DailyStat {
  date: string;
  weekday: string;
  count: number;
}

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  school_level: "校级重点",
  college_level: "院级重点",
  daily: "日常排练",
  temporary: "临时活动",
};

export const ACTIVITY_LEVEL_COLORS: Record<ActivityLevel, string> = {
  school_level: "bg-danger-500",
  college_level: "bg-warning-500",
  daily: "bg-primary-500",
  temporary: "bg-slate-400",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "待审批",
  approved: "已批准",
  rejected: "已驳回",
  rescheduled: "建议改期",
  cancelled: "已取消",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: "bg-warning-100 text-warning-700",
  approved: "bg-success-100 text-success-700",
  rejected: "bg-danger-100 text-danger-700",
  rescheduled: "bg-primary-100 text-primary-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  time_overlap: "时间重叠",
  capacity_exceeded: "人数超载",
  equipment_conflict: "器材撞车",
  teacher_conflict: "老师冲突",
};

export const CONFLICT_SEVERITY_LABELS: Record<ConflictSeverity, string> = {
  high: "严重",
  medium: "中等",
  low: "轻微",
};

export const CONFLICT_SEVERITY_COLORS: Record<ConflictSeverity, string> = {
  high: "bg-danger-500",
  medium: "bg-warning-500",
  low: "bg-primary-400",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  approval: "审批通过",
  rejection: "审批驳回",
  reschedule: "改期建议",
  conflict: "冲突预警",
  system: "系统公告",
};
