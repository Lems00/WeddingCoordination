import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../store";
import { cn } from "../utils/cn";
import { STATUS_COLORS, getAssigneeStyle, getTaskResponsible } from "../data";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ListChecks,
  Filter,
  X,
} from "lucide-react";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarView() {
  const { allTasks, currentProjectId, users } = useApp();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Only tasks for the current project
  const tasks = allTasks.filter((t) => t.project_id === currentProjectId);

  // Filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => statusFilter === "all" || t.status === statusFilter);
  }, [tasks, statusFilter]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start on Monday
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, key: d.toISOString().split("T")[0] });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, isCurrentMonth: true, key: date.toISOString().split("T")[0] });
    }

    // Next month padding to complete grid
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - startOffset - lastDay.getDate() + 1);
      days.push({ date: d, isCurrentMonth: false, key: d.toISOString().split("T")[0] });
    }

    return days;
  }, [currentDate]);

  // Tasks by date (considering multi-day tasks)
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    filteredTasks.forEach((t) => {
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      // Iterate each day the task spans
      const cur = new Date(start);
      while (cur <= end) {
        const key = cur.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(t);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [filteredTasks]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const todayKey = today.toISOString().split("T")[0];
  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  // Sélection par défaut au montage : aujourd'hui s'il a des tâches, sinon le
  // prochain jour avec tâches (sinon le premier). Une seule fois, pour ne pas
  // ré-ouvrir le panneau après que l'utilisateur l'ait fermé.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    const keys = Object.keys(tasksByDate).sort();
    if (keys.length === 0) return;
    didInit.current = true;
    setSelectedDate(tasksByDate[todayKey] ? todayKey : keys.find((k) => k >= todayKey) || keys[0]);
  }, [tasksByDate, todayKey]);

  // Stats
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthTasks = filteredTasks.filter((t) => {
      const d = new Date(t.start_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      total: monthTasks.length,
      done: monthTasks.filter((t) => t.status === "Terminé").length,
      inProgress: monthTasks.filter((t) => t.status === "En cours").length,
    };
  }, [currentDate, filteredTasks]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Calendrier
          </h1>
          <p className="text-slate-500 mt-1">Vue mensuelle des tâches du projet</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-slate-600 bg-white rounded-lg border border-slate-200 px-3 py-1.5">
            <ListChecks className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">{monthStats.total}</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-600 font-medium">{monthStats.done} ✓</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 transition">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 min-w-[180px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 transition">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={goToToday} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
              Aujourd'hui
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
              <option value="all">Tous statuts</option>
              <option value="À faire">À faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
              <option value="Bloqué">Bloqué</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">
          {/* Calendar grid */}
          <div className="p-3 border-r border-slate-100">
            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">
                  {d}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, isCurrentMonth, key }) => {
                const dayTasks = tasksByDate[key] || [];
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={cn(
                      "relative aspect-square rounded-xl p-1.5 text-left transition group border",
                      isCurrentMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 opacity-50",
                      isSelected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-slate-200",
                      isToday && !isSelected && "border-indigo-400"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn(
                        "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-indigo-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400",
                        weekend && isCurrentMonth && !isToday && "text-rose-500"
                      )}>
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] font-bold text-slate-500 mt-0.5">{dayTasks.length}</span>
                      )}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="mt-1 space-y-0.5 overflow-hidden">
                        {dayTasks.slice(0, 3).map((t) => {
                          const sc = STATUS_COLORS[t.status];
                          return (
                            <div key={t.id} className={cn("text-[9px] font-medium px-1 py-0.5 rounded truncate", sc.bg, sc.text)} title={t.task}>
                              {t.task}
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <div className="text-[9px] font-semibold text-slate-500 px-1">
                            +{dayTasks.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel — selected day */}
          <div className="p-5 bg-slate-50/50 min-h-[500px]">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long" })}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Aucune tâche pour cette date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map((t) => {
                      const sc = STATUS_COLORS[t.status];
                      const responsibleName = getTaskResponsible(t, users);
                      const assignee = getAssigneeStyle(responsibleName);
                      return (
                        <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-sm transition">
                          <div className="flex items-start gap-2">
                            <span className={cn("text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5")}>
                              {t.id}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 line-clamp-2">{t.task}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", sc.bg, sc.text)}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                                  {t.status}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <ListChecks className="w-3 h-3" />
                                  {t.category}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {t.duration}
                                </span>
                              </div>
                              {responsibleName !== "Non assigné" && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white"
                                    style={{ backgroundColor: assignee.color }}
                                    title={assignee.label}
                                  >
                                    {assignee.code}
                                  </div>
                                  <span className="text-[11px] text-slate-600 truncate">{responsibleName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <CalendarIcon className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Cliquez sur un jour</p>
                <p className="text-xs mt-1">pour voir les tâches planifiées</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
