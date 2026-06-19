import { useState, useMemo, useEffect, useRef } from "react";
import { Task, TaskStatus } from "../data";
import { User } from "../store";
import { cn } from "../utils/cn";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";
import {
  addDays,
  getDayStarts,
  getMonthStarts,
  getWeekStarts,
  dayLabel,
  monthLabel,
  weekLabel,
  isWeekend,
  getDateRangeFromTasks,
} from "../utils/ganttHelpers";
import { getTaskResponsible, getAssigneeStyle, PHASES } from "../data";

type GanttZoom = "jour" | "semaine" | "mois";

const SIDEBAR_W = 240;
const ROW_H = 46;
const HEAD_H = 60;
const PHASE_H = 38;

interface GanttViewProps {
  tasks: Task[];
  users: User[];
  currentProject?: { date?: string };
}

const PHASE_META: Record<string, { color: string; accent: string }> = {
  "Préparation": { color: "#A78BFA", accent: "#7C3AED" },
  "Veille": { color: "#F472B6", accent: "#DB2777" },
  "Jour J": { color: "#FB923C", accent: "#EA580C" },
};

const STATUS_META: Record<TaskStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  "Terminé": { icon: CheckCircle2, color: "#34D399", label: "Terminé" },
  "En cours": { icon: Clock, color: "#818CF8", label: "En cours" },
  "À faire": { icon: Circle, color: "#475569", label: "À faire" },
  "Bloqué": { icon: AlertCircle, color: "#F59E0B", label: "Bloqué" },
};

const ASSIGNEE_COLORS: Record<string, string> = {
  "C": "#10B981",
  "M": "#C084FC",
  "A": "#FB923C",
};

export default function GanttView({ tasks, users, currentProject }: GanttViewProps) {
  const [view, setView] = useState<GanttZoom>("semaine");
  const [daysToShow, setDaysToShow] = useState(14);
  const [monthsToShow, setMonthsToShow] = useState<3 | 4 | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ taskId: string; startX: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [vpWidth, setVpWidth] = useState(600);
  const [ganttHeight, setGanttHeight] = useState<number>(0);

  // Measure available timeline width (scroller width minus sidebar)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setVpWidth(Math.max(el.clientWidth - SIDEBAR_W, 200));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure available height: fill the viewport from the Gantt's top edge.
  // Robust against changes in the content above (title/filters) instead of a hard-coded offset.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      // Sum every ancestor's bottom padding (the page wrapper uses lg:p-8) so the
      // whole Gantt fits with no outer page scroll, whatever the breakpoint.
      let padBelow = 0;
      let node: HTMLElement | null = el;
      while (node && node !== document.body) {
        padBelow += parseFloat(getComputedStyle(node).paddingBottom) || 0;
        node = node.parentElement;
      }
      setGanttHeight(Math.max(window.innerHeight - top - padBelow - 8, 320));
    };
    update();
    window.addEventListener("resize", update);
    // Re-measure on next frames in case layout above settles after mount
    const t = setTimeout(update, 150);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Visual feedback during drag
      document.body.style.cursor = 'grabbing';
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragging) {
        const deltaX = e.clientX - dragging.startX;
        const deltaDays = Math.round(deltaX / 4); // 4px = 1 day approx

        const task = tasks.find(t => t.id === dragging.taskId);
        if (task && deltaDays !== 0) {
          const newStartDate = addDays(new Date(task.start_date), deltaDays);
          const newEndDate = addDays(new Date(task.end_date), deltaDays);
          // Update task dates (integrate with your update function)
          console.log(`Rescheduled ${task.id} by ${deltaDays} days`);
        }
      }
      setDragging(null);
      document.body.style.cursor = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, tasks]);

  if (tasks.length === 0) {
    return <div className="text-center py-12 text-slate-400">Aucune tâche</div>;
  }

  const { TIMELINE_START: baseStart, TIMELINE_END: baseEnd, TODAY } = getDateRangeFromTasks(
    tasks,
    currentProject?.date
  );

  let timelineStart = baseStart;
  let timelineEnd = baseEnd;

  if (view === "mois" && monthsToShow) {
    const allMonths = getMonthStarts(baseStart, baseEnd);
    if (allMonths.length > monthsToShow) {
      timelineStart = allMonths[0];
      timelineEnd = addDays(allMonths[Math.min(monthsToShow, allMonths.length - 1)], 30);
    }
  }

  const ticks: Date[] =
    view === "jour"
      ? getDayStarts(timelineStart, timelineEnd)
      : view === "mois"
        ? getMonthStarts(timelineStart, timelineEnd)
        : getWeekStarts(timelineStart, timelineEnd);

  const numPeriods = ticks.length;
  const percentPerPeriod = 100 / numPeriods;

  // Width model: in "jour" mode render the FULL range at a fixed width per day
  // (dayW derived from the slider) so it scrolls horizontally. Other modes fill the viewport.
  const isDay = view === "jour";
  const dayW = isDay ? Math.max(vpWidth / daysToShow, 28) : 0;
  const timelineWidth = isDay ? numPeriods * dayW : vpWidth;

  const px = (date: Date): number => {
    const offsetMs = date.getTime() - timelineStart.getTime();
    const totalMs = timelineEnd.getTime() - timelineStart.getTime();
    return (offsetMs / totalMs) * 100;
  };

  const todayX = px(TODAY);
  const todayLeftPx = SIDEBAR_W + (todayX / 100) * timelineWidth;

  // Center on today when entering "jour" mode or changing zoom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, todayLeftPx - el.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, daysToShow, vpWidth, timelineWidth]);

  const togglePhase = (p: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  };

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

  const isWkEnd = view === "jour";

  return (
    <div ref={rootRef} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full" style={{ height: ganttHeight ? ganttHeight : "calc(100vh - 18rem)" }}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="font-semibold text-slate-900">Diagramme de Gantt</h2>
          <p className="text-sm text-slate-500">Chronologie visuelle des tâches</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Aujourd'hui — {TODAY.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["Jour", "Semaine", "Mois"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase() as GanttZoom)}
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

      {/* Jour slider */}
      {view === "jour" && (
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap shrink-0">
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

      {/* Mois buttons */}
      {view === "mois" && (
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap shrink-0">
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

      {/* Main scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto overflow-x-auto relative"
        style={{
          backgroundImage: "linear-gradient(to left, rgba(0,0,0,0.05), transparent 80%)",
          backgroundAttachment: "local",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
          backgroundSize: "50px 100%"
        }}
      >
        <div className="relative" style={{ width: SIDEBAR_W + timelineWidth, minWidth: "100%" }}>
          {/* TODAY line - unique vertical line spanning the whole content (scrolls horizontally with it) */}
          <div
            className="absolute top-0 bottom-0 bg-red-500 z-10 pointer-events-none"
            style={{
              left: todayLeftPx,
              width: "2px",
              opacity: 0.7,
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)"
            }}
          />
          {/* Timeline header */}
          <div className="sticky top-0 z-30 flex" style={{ height: HEAD_H }}>
            <div
              className="sticky left-0 z-40 bg-white border-r border-b border-slate-100 flex items-center px-4"
              style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Tâche</span>
            </div>

            <div className="relative border-b border-slate-100 bg-white" style={{ width: timelineWidth }}>
              {/* Weekend shading */}
              {isWkEnd && ticks
                .filter((t) => isWeekend(t))
                .map((t, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 bg-orange-100/30"
                    style={{ left: `${px(t)}%`, width: percentPerPeriod + "%" }}
                  />
                ))}

              {/* Ticks */}
              {ticks.map((tick, i) => {
                const x = px(tick);
                const active = isActiveTick(tick);
                const [line1, line2] = tickLabel(tick).split(" ");
                return (
                  <div key={i} className="absolute top-0 bottom-0 flex flex-col items-center pt-1.5" style={{ left: `${x}%`, transform: "translateX(-50%)" }}>
                    <div className="w-px h-2 bg-slate-300 mb-1" />
                    <div className={`text-center leading-tight ${active ? "text-indigo-600" : "text-slate-600"}`}>
                      <div className="text-[12px] font-bold">{line1}</div>
                      {line2 && <div className="text-[9px] uppercase tracking-wide opacity-70">{line2}</div>}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Phases + tasks */}
          {PHASES.map((phase) => {
            const phaseTasks = groupedByPhase[phase];
            if (!phaseTasks || phaseTasks.length === 0) return null;

            const isCollapsed = collapsed.has(phase);
            const { color: phaseColor } = PHASE_META[phase] || { color: "#A78BFA" };

            return (
              <div key={phase}>
                {/* Phase header */}
                <div className="flex" style={{ height: PHASE_H }}>
                  <div
                    className="sticky left-0 z-20 bg-slate-50 border-r border-b border-slate-100 flex items-center"
                    style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}
                  >
                    <button
                      onClick={() => togglePhase(phase)}
                      className="w-full flex items-center gap-2 px-4 h-full hover:bg-slate-100 transition"
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

                  <div className="relative border-b border-slate-100 bg-white" style={{ width: timelineWidth }}>
                    {ticks.map((t, i) => (
                      <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left: `${px(t)}%` }} />
                    ))}
                  </div>
                </div>

                {/* Task rows */}
                {!isCollapsed &&
                  phaseTasks.map((task) => {
                    const barX = px(new Date(task.start_date));
                    const barW = Math.max(px(new Date(task.end_date)) - barX, 6);
                    const isH = hovered === task.id;
                    const responsibleName = getTaskResponsible(task, users);
                    const assignee = getAssigneeStyle(responsibleName);
                    const sm = STATUS_META[task.status];
                    const StatusIcon = sm.icon;
                    const isDimmed = task.status === "À faire" || task.status === "Bloqué";

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex border-b transition",
                          isH ? "bg-indigo-50/30 border-indigo-100" : "border-slate-50 hover:bg-slate-100/40"
                        )}
                        style={{ height: ROW_H }}
                        onMouseEnter={() => setHovered(task.id)}
                        onMouseLeave={() => setHovered(null)}
                        title={`${task.id}: ${task.task} (${task.status})`}
                      >
                        {/* Task info */}
                        <div
                          className={cn(
                            "sticky left-0 z-20 border-r border-slate-100 flex items-center gap-2.5 px-4 transition",
                            isH ? "bg-slate-50" : "bg-white"
                          )}
                          style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}
                        >
                          <span
                            className="text-[9px] shrink-0 w-6 text-right font-mono font-bold"
                            style={{ color: phaseColor + "80" }}
                          >
                            {task.id}
                          </span>
                          <StatusIcon size={11} style={{ color: sm.color }} className="shrink-0" />
                          <span className={cn("text-[11px] truncate transition", isH ? "text-slate-800 font-medium" : "text-slate-700")}>
                            {task.task}
                          </span>
                        </div>

                        {/* Timeline cell */}
                        <div className="relative bg-white" style={{ width: timelineWidth }}>
                          {/* Weekend shading */}
                          {isWkEnd && ticks
                            .filter((t) => isWeekend(t))
                            .map((t, i) => (
                              <div
                                key={i}
                                className="absolute top-0 bottom-0 bg-orange-100/30"
                                style={{ left: `${px(t)}%`, width: percentPerPeriod + "%" }}
                              />
                            ))}
                          {ticks.map((t, i) => (
                            <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: `${px(t)}%` }} />
                          ))}

                          {/* Task bar */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 overflow-hidden rounded-full shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
                            style={{
                              left: `${barX}%`,
                              width: `max(${barW}%, 32px)`,
                              height: 26,
                              backgroundColor: sm.color,
                              opacity: isDimmed ? 0.3 : 0.88,
                              paddingLeft: 6,
                              paddingRight: 8,
                              minWidth: 32,
                              boxShadow: isH && !isDimmed
                                ? `0 0 0 2px ${sm.color}40, 0 0 12px ${sm.color}50, 0 4px 20px ${sm.color}35`
                                : "0 0 0 1px ${sm.color}20",
                              filter: isH && !isDimmed ? "brightness(1.15)" : "brightness(1)",
                            }}
                            onMouseDown={(e) => {
                              if (e.button === 0) setDragging({ taskId: task.id, startX: e.clientX });
                            }}
                          >
                            {assignee && (
                              <span
                                className="shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold text-white cursor-help"
                                style={{ width: 16, height: 16, backgroundColor: assignee.color, flexShrink: 0 }}
                                title={responsibleName || "Responsable"}
                              >
                                {assignee.code}
                              </span>
                            )}
                            {barW > 90 && responsibleName && (
                              <span className="text-[10px] text-white/75 truncate font-medium leading-none">
                                {responsibleName}
                              </span>
                            )}
                            {task.status === "Terminé" && barW > 50 && (
                              <span className="ml-auto text-[10px] text-white/40 shrink-0">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}

          {/* Bottom padding */}
          <div className="flex" style={{ height: 48 }}>
            <div className="sticky left-0 bg-white border-r border-slate-100" style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }} />
            <div className="relative" style={{ width: timelineWidth }}>
              {ticks.map((t, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: `${px(t)}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Sticky bottom */}
      <div className="sticky bottom-0 z-40 flex items-center gap-5 px-5 py-2.5 border-t border-slate-100 bg-white text-[10px] text-slate-600 shadow-lg shadow-slate-100/50">
        <span className="uppercase tracking-widest font-semibold text-slate-700">Légende</span>
        {(Object.entries(STATUS_META) as [TaskStatus, typeof STATUS_META[TaskStatus]][]).map(([key, { color, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-4 h-px bg-red-500/50 inline-block" />
          Aujourd'hui
        </div>
      </div>
    </div>
  );
}
