import { Task } from "../data";
import { User } from "../store";

interface GanttViewProps {
  tasks: Task[];
  users: User[];
  currentProject?: { date?: string };
}

export default function GanttView({ tasks, users, currentProject }: GanttViewProps) {
  if (tasks.length === 0) {
    return <div className="text-center py-12 text-slate-400">Aucune tâche</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col flex-1 h-full w-full">
      <div className="p-6 text-center text-slate-500">
        <p className="text-lg font-medium">Gantt Chart</p>
        <p className="text-sm mt-2">En construction - Repartir sur des bases propres</p>
        <p className="text-xs mt-4 text-slate-400">({tasks.length} tâches chargées)</p>
      </div>
    </div>
  );
}
