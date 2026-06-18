import { Task, TaskStatus } from "../data";

// Timeline Constants
export const getTimelineConstants = (projectDate?: string) => {
  const TIMELINE_START = new Date(projectDate || new Date().toISOString());
  TIMELINE_START.setDate(TIMELINE_START.getDate() - 2);
  TIMELINE_START.setHours(0, 0, 0, 0);

  const TIMELINE_END = new Date(TIMELINE_START);
  TIMELINE_END.setDate(TIMELINE_END.getDate() + 56); // 56 days default
  TIMELINE_END.setHours(23, 59, 59, 999);

  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  return { TIMELINE_START, TIMELINE_END, TODAY };
};

// Pixel per day config
export const PX_PER_DAY: Record<"jour" | "semaine" | "mois", number> = {
  jour: 48,
  semaine: 26,
  mois: 11,
};

const FR_MONTHS = ["jan", "fév", "mars", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

// Utility functions
export const addDays = (date: Date, n: number): Date => {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
};

export const getDayStarts = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return days;
};

export const getMonthStarts = (start: Date, end: Date): Date[] => {
  const months: Date[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    months.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months;
};

export const getWeekStarts = (start: Date, end: Date): Date[] => {
  const weeks: Date[] = [];
  let cur = new Date(start);
  while (cur <= end) {
    weeks.push(new Date(cur));
    cur = addDays(cur, 7);
  }
  return weeks;
};

export const dayLabel = (date: Date): string => {
  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  return `${days[date.getDay()]} ${date.getDate()}`;
};

export const monthLabel = (date: Date): string => {
  return `${FR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export const weekLabel = (date: Date): string => {
  return `${date.getDate()} ${FR_MONTHS[date.getMonth()]}`;
};

export const isWeekend = (date: Date): boolean => {
  return date.getDay() === 0 || date.getDay() === 6;
};

// Status colors
export const getTaskStatusColor = (status: TaskStatus): string => {
  const statusColors: Record<TaskStatus, string> = {
    "À faire": "#94a3b8",     // slate-400
    "En cours": "#3b82f6",    // blue-500
    "Terminé": "#10b981",     // emerald-500
    "Bloqué": "#ef4444",      // red-500
  };
  return statusColors[status] || "#64748b";
};

export const getTaskStatusBgClass = (status: TaskStatus): string => {
  const classes: Record<TaskStatus, string> = {
    "À faire": "bg-slate-400",
    "En cours": "bg-blue-500",
    "Terminé": "bg-emerald-500",
    "Bloqué": "bg-red-500",
  };
  return classes[status] || "bg-slate-400";
};

// Position calculator
export const calculatePosition = (date: Date, timelineStart: Date, timelineEnd: Date): number => {
  const offsetMs = date.getTime() - timelineStart.getTime();
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  if (totalMs === 0) return 0;
  return (offsetMs / totalMs) * 100; // Returns percentage
};

// Phase colors
export const getPhaseColor = (phase: string): string => {
  const phaseColors: Record<string, string> = {
    "Préparation": "#a78bfa",  // violet-400
    "Veille": "#fb923c",       // orange-400
    "Jour J": "#f472b6",       // pink-400
  };
  return phaseColors[phase] || "#a78bfa";
};

export const getPhaseColorClass = (phase: string): string => {
  const classes: Record<string, string> = {
    "Préparation": "text-violet-600",
    "Veille": "text-orange-600",
    "Jour J": "text-pink-600",
  };
  return classes[phase] || "text-violet-600";
};

// Get date range from tasks
export const getDateRangeFromTasks = (tasks: Task[], projectDate?: string) => {
  if (tasks.length === 0) {
    return getTimelineConstants(projectDate);
  }

  const allDates = tasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)]);
  let minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  let maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  minDate.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);
  minDate.setDate(minDate.getDate() - 2);

  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  return { TIMELINE_START: minDate, TIMELINE_END: maxDate, TODAY };
};
