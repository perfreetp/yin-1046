export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export const timeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  return s1 < e2 && s2 < e1;
};

export const getDurationMinutes = (start: string, end: string): number => {
  return parseTime(end) - parseTime(start);
};

export const getWeekDates = (baseDate?: Date): string[] => {
  const date = baseDate ? new Date(baseDate) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

export const getWeekdayName = (dateStr: string): string => {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const date = new Date(dateStr);
  return weekdays[date.getDay()];
};

export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

export const isToday = (dateStr: string): boolean => {
  return dateStr === formatDate(new Date());
};

export const isTomorrow = (dateStr: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === formatDate(tomorrow);
};

export const getDateLabel = (dateStr: string): string => {
  if (isToday(dateStr)) return "今天";
  if (isTomorrow(dateStr)) return "明天";
  return formatDateDisplay(dateStr) + " " + getWeekdayName(dateStr);
};
