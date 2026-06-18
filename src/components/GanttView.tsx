import { useState, useMemo } from "react";
import { Task, TaskStatus } from "../data";
import { User } from "../store";
import { cn } from "../utils/cn";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getTimelineConstants,
  PX_PER_DAY,
  addDays,
  getDayStarts,
  getMonthStarts,
  getWeekStarts,
  dayLabel,
  monthLabel,
  weekLabel,
  isWeekend,
  getTaskStatusColor,
  getTaskStatusBgClass,
  calculatePosition,
  getPhaseColor,
  getPhaseColorClass,
  getDateRangeFromTasks,
} from "../utils/ganttHelpers";
import { getResponsibleName, getAssigneeStyle, PHASES } from "../data";

type GanttZoom = "jour" | "semaine" | "mois";

const SIDEBAR_W = 268;
const ROW_H = 46;
const HEAD_H = 44;
const PHASE_H = 38;

interface GanttViewProps {
  tasks: Task[];
  users: User[];
  currentProject?: { date?: string };
}

export default function GanttView({ tasks, users, currentProject }: GanttViewProps) {
  const [view, setView] = useState<GanttZoom>("semaine");
  const [daysToShow, setDaysToShow] = useState(7);
  const [monthsToShow, setMonthsToShow] = useState<3 | 4 | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <div className="text-center py-12 text-slate-400">Aucune tâche</div>;
  }

  // Get timeline constants
  const { TIMELINE_START: baseStart, TIMELINE_END: baseEnd, TODAY } = getDateRangeFromTasks(
    tasks,
    currentProject?.date
  );

  // Apply zoom constraints
  let timelineStart = baseStart;
  let timelineEnd = baseEnd;

  if (view === "jour") {
    const allDays = getDayStarts(baseStart, baseEnd);
    if (allDays.length > daysToShow) {
      timelineStart = allDays[0];
      timelineEnd = allDays[Math.min(daysToShow - 1, allDays.length - 1)];
    }
  } else if (view === "mois" && monthsToShow) {
    const allMonths = getMonthStarts(baseStart, baseEnd);
    if (allMonths.length > monthsToShow) {
      timelineStart = allMonths[0];
      timelineEnd = addDays(allMonths[Math.min(monthsToShow, allMonths.length - 1)], 30);
    }
  }

  // Build ticks
  const ticks: Date[] =
    view === "jour"
      ? getDayStarts(timelineStart, timelineEnd)
      : view === "mois"
        ? getMonthStarts(timelineStart, timelineEnd)
        : getWeekStarts(timelineStart, timelineEnd);

  const numPeriods = ticks.length;
  const percentPerPeriod = 100 / numPeriods;

  // Position calculator
  const px = (date: Date): number => {
    return calculatePosition(date, timelineStart, timelineEnd);
  };

  const todayX = px(TODAY);
  const isWkEnd = view === "jour";

  // Toggle phase collapse
  const togglePhase = (p: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  };

  // Group tasks by phase
  const groupedByPhase = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    PHASES.forEach((p) => {
      groups[p] = tasks.filter((t) => t.phase === p).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });
    return groups;
  }, [tasks]);

  const tickLabel = (t: Date) => (view === "jour" ? dayLabel(t) : view === "mois" ? monthLabel(t) : weekLabel(t));

  const isActiveTick = (t: Date) => {
    if (view === "jour") return t.toDateString() === TODAY.toDateString();
    if (view === "mois") return t.getMonth() === TODAY.getMonth() && t.getFullYear() === TODAY.getFullYear();
    return t <= TODAY && addDays(t, 7) > TODAY;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">Diagramme de Gantt</h2>
          <p className="text-sm text-slate-500">Chronologie visuelle des tâches</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["Jour", "Semaine", "Mois"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v.toLowerCase() as GanttZoom);
                  setDaysToShow(7);
                  setMonthsToShow(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition",
                  view === v.toLowerCase() ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day zoom slider */}
      {view === "jour" && (
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-600">Jours visibles:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 w-5">{daysToShow}</span>
            <input
              type="range"
              min="1"
              max={getDayStarts(baseStart, baseEnd).length}
              value={daysToShow}
              onChange={(e) => setDaysToShow(parseInt(e.target.value))}
              className="w-32 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              style={{
                background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${(daysToShow / getDayStarts(baseStart, baseEnd).length) * 100}%, #e2e8f0 ${(daysToShow / getDayStarts(baseStart, baseEnd).length) * 100}%, #e2e8f0 100%)`,
              }}
            />
            <span className="text-xs text-slate-500">{getDayStarts(baseStart, baseEnd).length}</span>
          </div>
        </div>
      )}

      {/* Month range buttons */}
      {view === "mois" && (
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-600">Affichage:</span>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {[
              { label: "3 mois", value: 3 as const },
              { label: "4 mois", value: 4 as const },
              { label: "Tous", value: null },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setMonthsToShow(value)}
                className={cn(
                  "text-xs px-2 py-1 rounded transition-all",
                  monthsToShow === value ? "bg-indigo-100 text-indigo-600 font-medium" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Gantt Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-100 bg-white">
          {/* Header */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tâche</span>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-indigo-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {PHASES.map((phase) => {
              const phaseTasks = groupedByPhase[phase];
              if (phaseTasks.length === 0) return null;

              const isCollapsed = collapsed.has(phase);
              const phaseColor = getPhaseColor(phase);

              return (
                <div key={phase}>
                  {/* Phase Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 sticky top-0 z-5">
                    <button
                      onClick={() => togglePhase(phase)}
                      className="w-full flex items-center gap-2 hover:bg-slate-100 rounded p-1 transition"
                    >
                      {isCollapsed ? (
                        <ChevronRight size={14} className="text-slate-700" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-700" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: phaseColor }}>
                        {phase}
                      </span>
                      <span
                        className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${phaseColor}18`, color: phaseColor }}
                      >
                        {phaseTasks.length}
                      </span>
                    </button>
                  </div>

                  {/* Task List */}
                  {!isCollapsed &&
                    phaseTasks.map((task) => {
                      const isH = hovered === task.id;
                      const responsibleName = getResponsibleName(task.responsible_user_id, users);
                      const assignee = getAssigneeStyle(responsibleName);

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "border-b border-slate-50 hover:bg-slate-50/50 transition px-4 py-2 flex items-center gap-2 cursor-default",
                            isH && "bg-slate-50"
                          )}
                          onMouseEnter={() => setHovered(task.id)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-mono font-bold text-slate-600">{task.id}</div>
                            <div className="text-xs text-slate-700 truncate">{task.task}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Header */}
          <div className="bg-white border-b border-slate-200 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-indigo-400 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="relative h-11 flex" style={{ minWidth: "100%" }}>
              <div className="relative border-b border-slate-200 bg-white flex-1">
                {/* Weekend shading */}
                {isWkEnd &&
                  ticks
                    .filter((t) => isWeekend(t))
                    .map((t, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 bg-slate-50"
                        style={{ left: `${px(t)}%`, width: percentPerPeriod + "%" }}
                      />
                    ))}

                {/* Tick marks and labels */}
                {ticks.map((tick, i) => {
                  const x = px(tick);
                  const active = isActiveTick(tick);
                  return (
                    <div key={i} className="absolute top-0 bottom-0 flex flex-col justify-end pb-1" style={{ left: `${x}%` }}>
                      <div className="w-px h-1.5 bg-slate-200 mb-1" />
                      <span className={cn("text-[9px] whitespace-nowrap pl-1 font-medium", active ? "text-indigo-600" : "text-slate-600")}>
                        {tickLabel(tick)}
                      </span>
                    </div>
                  );
                })}

                {/* Today line */}
                {TODAY >= timelineStart && TODAY <= timelineEnd && (
                  <div className="absolute top-0 bottom-0 w-px bg-red-500/40 z-10" style={{ left: `${todayX}%` }} />
                )}
              </div>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-indigo-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2">
            <div className="relative flex" style={{ minWidth: "100%" }}>
              {PHASES.map((phase) => {
                const phaseTasks = groupedByPhase[phase];
                if (phaseTasks.length === 0) return null;
                const isCollapsed = collapsed.has(phase);
                const phaseColor = getPhaseColor(phase);

                return (
                  <div key={phase} className="flex-1 border-r border-slate-100">
                    {/* Phase header row */}
                    <div className="bg-slate-50 border-b border-slate-100 h-11 flex items-center relative">
                      {ticks.map((t, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left: `${px(t)}%` }} />
                      ))}
                    </div>

                    {/* Task rows */}
                    {!isCollapsed &&
                      phaseTasks.map((task) => {
                        const barX = px(new Date(task.start_date));
                        const barW = Math.max(px(new Date(task.end_date)) - barX, 4);
                        const isH = hovered === task.id;
                        const responsibleName = getResponsibleName(task.responsible_user_id, users);
                        const assignee = getAssigneeStyle(responsibleName);
                        const isDimmed = task.status === "À faire" || task.status === "Bloqué";

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "border-b border-slate-50 hover:bg-slate-50/50 transition h-10 relative",
                              isH && "bg-slate-50"
                            )}
                            onMouseEnter={() => setHovered(task.id)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            {/* Grid background */}
                            {isWkEnd &&
                              ticks
                                .filter((t) => isWeekend(t))
                                .map((t, i) => (
                                  <div
                                    key={i}
                                    className="absolute top-0 bottom-0 bg-white/50"
                                    style={{ left: `${px(t)}%`, width: percentPerPeriod + "%" }}
                                  />
                                ))}
                            {ticks.map((t, i) => (
                              <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: `${px(t)}%` }} />
                            ))}
                            {TODAY >= timelineStart && TODAY <= timelineEnd && (
                              <div className="absolute top-0 bottom-0 w-px bg-red-500/20 z-10" style={{ left: `${todayX}%` }} />
                            )}

                            {/* Task bar */}
                            <div
                              className={cn(
                                "absolute top-1.5 bottom-1.5 rounded-full shadow-sm flex items-center gap-1.5 px-2 text-white text-[10px] font-medium overflow-hidden whitespace-nowrap hover:shadow-md transition cursor-pointer",
                                getTaskStatusBgClass(task.status)
                              )}
                              style={{
                                left: `${barX}%`,
                                width: `${barW}%`,
                                opacity: isDimmed ? 0.5 : 1,
                              }}
                              title={`${task.id} — ${task.task}`}
                            >
                              {barW > 30 && (
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0 ring-1 ring-white/40"
                                  style={{ backgroundColor: assignee.color }}
                                >
                                  {assignee.code}
                                </span>
                              )}
                              {barW > 60 && <span className="truncate text-[9px]">{responsibleName}</span>}
                              {task.status === "Terminé" && barW > 50 && <span className="ml-auto text-[9px]">✓</span>}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="shrink-0 flex items-center gap-5 px-5 py-2.5 border-t border-slate-100 bg-white text-[10px] text-slate-600">
        <span className="uppercase tracking-widest font-semibold text-slate-700">Légende</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-slate-400" />
          À faire
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-blue-500" />
          En cours
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-emerald-500" />
          Terminé
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-red-500" />
          Bloqué
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-4 h-px bg-red-500/50 inline-block" />
          Aujourd'hui
        </div>
      </div>
    </div>
  );
}
