import {
  RehearsalApplication,
  Venue,
  Equipment,
  Conflict,
  ConflictType,
  ConflictSeverity,
} from "@/types";
import { timeOverlap, getDurationMinutes } from "./dateUtils";

const LEVEL_SCORES: Record<string, number> = {
  school_level: 40,
  college_level: 30,
  daily: 15,
  temporary: 10,
};

export const calculatePriorityScore = (
  app: RehearsalApplication
): number => {
  let score = 0;

  score += LEVEL_SCORES[app.activityLevel] || 10;

  const today = new Date();
  const appDate = new Date(app.date);
  const daysDiff = Math.ceil(
    (appDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 0) {
    score += 30;
  } else if (daysDiff <= 3) {
    score += 25;
  } else if (daysDiff <= 7) {
    score += 15;
  } else if (daysDiff <= 14) {
    score += 5;
  }

  if (app.participantCount >= 100) {
    score += 20;
  } else if (app.participantCount >= 50) {
    score += 15;
  } else if (app.participantCount >= 20) {
    score += 10;
  } else {
    score += 5;
  }

  return score;
};

export const sortApplications = (
  applications: RehearsalApplication[]
): RehearsalApplication[] => {
  return [...applications]
    .map((app) => ({
      ...app,
      priorityScore: calculatePriorityScore(app),
    }))
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
};

export const detectTimeConflicts = (
  applications: RehearsalApplication[]
): Conflict[] => {
  const conflicts: Conflict[] = [];
  const venueGroups: Record<string, RehearsalApplication[]> = {};

  applications
    .filter((a) => a.status === "approved" || a.status === "pending")
    .forEach((app) => {
      if (!venueGroups[app.venueId]) {
        venueGroups[app.venueId] = [];
      }
      venueGroups[app.venueId].push(app);
    });

  let conflictId = 0;
  Object.entries(venueGroups).forEach(([venueId, apps]) => {
    const dateGroups: Record<string, RehearsalApplication[]> = {};
    apps.forEach((app) => {
      if (!dateGroups[app.date]) {
        dateGroups[app.date] = [];
      }
      dateGroups[app.date].push(app);
    });

    Object.entries(dateGroups).forEach(([date, dateApps]) => {
      for (let i = 0; i < dateApps.length; i++) {
        for (let j = i + 1; j < dateApps.length; j++) {
          if (
            timeOverlap(
              dateApps[i].startTime,
              dateApps[i].endTime,
              dateApps[j].startTime,
              dateApps[j].endTime
            )
          ) {
            const overlapDuration = Math.min(
              getDurationMinutes(dateApps[i].startTime, dateApps[j].endTime),
              getDurationMinutes(dateApps[j].startTime, dateApps[i].endTime)
            );

            let severity: ConflictSeverity = "low";
            if (overlapDuration > 60) severity = "high";
            else if (overlapDuration > 30) severity = "medium";

            conflicts.push({
              id: `conf_time_${conflictId++}`,
              type: "time_overlap" as ConflictType,
              description: `${dateApps[i].venueName}在${date}有时间重叠`,
              severity,
              relatedApplicationIds: [dateApps[i].id, dateApps[j].id],
              relatedApplicationNames: [
                dateApps[i].activityName,
                dateApps[j].activityName,
              ],
              status: "pending",
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });
  });

  return conflicts;
};

export const detectCapacityConflicts = (
  applications: RehearsalApplication[],
  venues: Venue[]
): Conflict[] => {
  const conflicts: Conflict[] = [];
  let conflictId = 0;

  applications
    .filter((a) => a.status === "pending" || a.status === "approved")
    .forEach((app) => {
      const venue = venues.find((v) => v.id === app.venueId);
      if (venue && app.participantCount > venue.capacity) {
        const exceedRatio = app.participantCount / venue.capacity;
        let severity: ConflictSeverity = "low";
        if (exceedRatio > 1.5) severity = "high";
        else if (exceedRatio > 1.2) severity = "medium";

        conflicts.push({
          id: `conf_cap_${conflictId++}`,
          type: "capacity_exceeded" as ConflictType,
          description: `${app.venueName}容量${venue.capacity}人，申请人数${app.participantCount}人`,
          severity,
          relatedApplicationIds: [app.id],
          relatedApplicationNames: [app.activityName],
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    });

  return conflicts;
};

export const detectEquipmentConflicts = (
  applications: RehearsalApplication[],
  equipmentList: Equipment[]
): Conflict[] => {
  const conflicts: Conflict[] = [];
  const equipmentUsage: Record<string, RehearsalApplication[]> = {};

  applications
    .filter((a) => a.status === "approved" || a.status === "pending")
    .forEach((app) => {
      app.equipmentIds.forEach((eqId) => {
        if (!equipmentUsage[eqId]) {
          equipmentUsage[eqId] = [];
        }
        equipmentUsage[eqId].push(app);
      });
    });

  let conflictId = 0;
  Object.entries(equipmentUsage).forEach(([eqId, apps]) => {
    const equipment = equipmentList.find((e) => e.id === eqId);
    if (!equipment) return;

    const dateGroups: Record<string, RehearsalApplication[]> = {};
    apps.forEach((app) => {
      if (!dateGroups[app.date]) {
        dateGroups[app.date] = [];
      }
      dateGroups[app.date].push(app);
    });

    Object.entries(dateGroups).forEach(([date, dateApps]) => {
      const overlapping: RehearsalApplication[] = [];

      for (let i = 0; i < dateApps.length; i++) {
        for (let j = i + 1; j < dateApps.length; j++) {
          if (
            timeOverlap(
              dateApps[i].startTime,
              dateApps[i].endTime,
              dateApps[j].startTime,
              dateApps[j].endTime
            )
          ) {
            if (!overlapping.includes(dateApps[i]))
              overlapping.push(dateApps[i]);
            if (!overlapping.includes(dateApps[j]))
              overlapping.push(dateApps[j]);
          }
        }
      }

      if (overlapping.length > equipment.totalQuantity) {
        let severity: ConflictSeverity = "low";
        if (overlapping.length - equipment.totalQuantity >= 3)
          severity = "high";
        else if (overlapping.length - equipment.totalQuantity >= 2)
          severity = "medium";

        conflicts.push({
          id: `conf_eq_${conflictId++}`,
          type: "equipment_conflict" as ConflictType,
          description: `${equipment.name}库存${equipment.totalQuantity}件，${date}同时需要${overlapping.length}件`,
          severity,
          relatedApplicationIds: overlapping.map((a) => a.id),
          relatedApplicationNames: overlapping.map((a) => a.activityName),
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    });
  });

  return conflicts;
};

export const detectTeacherConflicts = (
  applications: RehearsalApplication[]
): Conflict[] => {
  const conflicts: Conflict[] = [];
  const teacherApps: Record<string, RehearsalApplication[]> = {};

  applications
    .filter((a) => a.status === "approved" || a.status === "pending")
    .filter((a) => a.teacherId)
    .forEach((app) => {
      if (!teacherApps[app.teacherId]) {
        teacherApps[app.teacherId] = [];
      }
      teacherApps[app.teacherId].push(app);
    });

  let conflictId = 0;
  Object.entries(teacherApps).forEach(([teacherId, apps]) => {
    const dateGroups: Record<string, RehearsalApplication[]> = {};
    apps.forEach((app) => {
      if (!dateGroups[app.date]) {
        dateGroups[app.date] = [];
      }
      dateGroups[app.date].push(app);
    });

    Object.entries(dateGroups).forEach(([date, dateApps]) => {
      for (let i = 0; i < dateApps.length; i++) {
        for (let j = i + 1; j < dateApps.length; j++) {
          if (
            timeOverlap(
              dateApps[i].startTime,
              dateApps[i].endTime,
              dateApps[j].startTime,
              dateApps[j].endTime
            )
          ) {
            conflicts.push({
              id: `conf_teacher_${conflictId++}`,
              type: "teacher_conflict" as ConflictType,
              description: `${dateApps[i].teacherName}老师在${date}有时间冲突`,
              severity: "high",
              relatedApplicationIds: [dateApps[i].id, dateApps[j].id],
              relatedApplicationNames: [
                dateApps[i].activityName,
                dateApps[j].activityName,
              ],
              status: "pending",
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });
  });

  return conflicts;
};

export const detectAllConflicts = (
  applications: RehearsalApplication[],
  venues: Venue[],
  equipmentList: Equipment[]
): Conflict[] => {
  const timeConflicts = detectTimeConflicts(applications);
  const capacityConflicts = detectCapacityConflicts(applications, venues);
  const equipmentConflicts = detectEquipmentConflicts(applications, equipmentList);
  const teacherConflicts = detectTeacherConflicts(applications);

  return [
    ...timeConflicts,
    ...capacityConflicts,
    ...equipmentConflicts,
    ...teacherConflicts,
  ];
};
