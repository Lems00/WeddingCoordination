import { useState, useRef, useEffect } from "react";
import { useApp } from "../store";
import { cn } from "../utils/cn";
import { Bell, CheckCheck, Inbox, Sparkles, Calendar, Tag, DollarSign, Package, Briefcase, AtSign } from "lucide-react";

export default function NotificationsPanel() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, getProjectById } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const iconForType = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_status":
        return <Tag className="w-4 h-4" />;
      case "vendor_added":
        return <Package className="w-4 h-4" />;
      case "budget_added":
        return <DollarSign className="w-4 h-4" />;
      case "project_assigned":
        return <Briefcase className="w-4 h-4" />;
      case "due_soon":
        return <Calendar className="w-4 h-4" />;
      case "mention":
        return <AtSign className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const colorForType = (type: string) => {
    switch (type) {
      case "task_assigned": return "bg-blue-100 text-blue-600";
      case "task_status": return "bg-indigo-100 text-indigo-600";
      case "vendor_added": return "bg-emerald-100 text-emerald-600";
      case "budget_added": return "bg-amber-100 text-amber-600";
      case "project_assigned": return "bg-violet-100 text-violet-600";
      case "due_soon": return "bg-orange-100 text-orange-600";
      case "mention": return "bg-pink-100 text-pink-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const formatTime = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-lg text-slate-600 hover:bg-white/80 transition",
          open && "bg-white/80"
        )}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.slice(0, 20).map((n) => {
                  const project = n.project_id ? getProjectById(n.project_id) : null;
                  return (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-slate-50 transition",
                        !n.is_read && "bg-indigo-50/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorForType(n.type))}>
                          {iconForType(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900">{n.title}</p>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                            <span>{formatTime(n.created_at)}</span>
                            {project && (
                              <>
                                <span>·</span>
                                <span className="truncate">{project.couple}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
