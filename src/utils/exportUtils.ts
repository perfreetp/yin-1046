import { RehearsalApplication } from "@/types";
import { getWeekdayName } from "./dateUtils";

export const generateWeeklyScheduleCSV = (
  applications: RehearsalApplication[],
  weekDates: string[]
): string => {
  const headers = ["时间", ...weekDates.map((d) => getWeekdayName(d) + " " + d.slice(5))];

  const timeSlots = [];
  for (let h = 8; h <= 22; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
  }

  const rows: string[][] = [];
  rows.push(headers);

  timeSlots.forEach((time) => {
    const row: string[] = [time];
    weekDates.forEach((date) => {
      const app = applications.find(
        (a) =>
          a.date === date &&
          a.startTime <= time &&
          a.endTime > time &&
          a.status === "approved"
      );
      if (app) {
        row.push(`${app.clubName} - ${app.activityName}`);
      } else {
        row.push("");
      }
    });
    rows.push(row);
  });

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportWeeklySchedule = (
  applications: RehearsalApplication[],
  weekDates: string[]
) => {
  const csv = generateWeeklyScheduleCSV(applications, weekDates);
  downloadCSV(csv, `周排练表_${weekDates[0]}_${weekDates[6]}.csv`);
};
