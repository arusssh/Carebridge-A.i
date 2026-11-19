import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sun, 
  Sunset, 
  Moon, 
  Activity, 
  Pill, 
  CheckSquare, 
  TrendingUp,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';
import { CarePlan, CareTaskItem, AdherenceStats, TaskStatus, TimeOfDay } from '../types';

interface TaskTrackerProps {
  carePlan: CarePlan;
  adherence: AdherenceStats;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus, notes?: string) => Promise<void>;
}

export const TaskTracker: React.FC<TaskTrackerProps> = ({
  carePlan,
  adherence,
  onUpdateTaskStatus
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = async (task: CareTaskItem) => {
    setCompletingTaskId(task.id);
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await onUpdateTaskStatus(task.id, newStatus);
      showToast(newStatus === 'COMPLETED' ? `Marked "${task.title}" as completed.` : `Reopened "${task.title}".`);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleCompleteAllMorning = async () => {
    const morningPending = carePlan.tasks.filter(t => t.time_of_day === 'MORNING' && t.status !== 'COMPLETED');
    if (morningPending.length === 0) {
      showToast('All morning tasks are already completed.');
      return;
    }

    setIsBatchProcessing(true);
    try {
      for (const t of morningPending) {
        await onUpdateTaskStatus(t.id, 'COMPLETED');
      }
      showToast('All morning protocol tasks completed!');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'MEDICATION', label: 'Medications' },
    { id: 'VITALS_CHECK', label: 'Vitals & Monitoring' },
    { id: 'PHYSICAL_THERAPY', label: 'Rehab & Exercises' },
    { id: 'WOUND_CARE', label: 'Wound & Incisions' },
    { id: 'DIET_LIFESTYLE', label: 'Diet & Lifestyle' }
  ];

  const filteredTasks = carePlan.tasks.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (statusFilter === 'PENDING') return t.status !== 'COMPLETED';
    if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const morningTasks = filteredTasks.filter((t) => t.time_of_day === 'MORNING');
  const afternoonTasks = filteredTasks.filter((t) => t.time_of_day === 'AFTERNOON');
  const eveningTasks = filteredTasks.filter((t) => t.time_of_day === 'EVENING' || t.time_of_day === 'BEDTIME');
  const prnTasks = filteredTasks.filter((t) => t.time_of_day === 'AS_NEEDED' || t.time_of_day === 'SPECIFIC_TIME');

  // Adherence evaluation
  const rate = adherence.adherence_rate;
  const adherenceLabel = rate >= 80 
    ? 'Optimal Adherence' 
    : rate >= 50 
    ? 'Protocol In Progress' 
    : 'Action Required';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Adherence Overview Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Clinical Compliance &amp; Protocol Adherence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Daily Care Tasks &amp; Protocol Checklist
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Track prescribed medication administrations, vitals monitoring, and daily recovery routines. Check off items as completed to maintain active clinical synchronization.
            </p>
          </div>

          {/* Adherence Ring & Divided Stats (Taste-Skill App Archetype) */}
          <div className="flex items-center gap-5 shrink-0 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600 transition-all duration-700 ease-out"
                  strokeDasharray={`${adherence.adherence_rate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-bold text-slate-900 tabular-nums">{adherence.adherence_rate}%</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {adherenceLabel}
              </span>
              <div className="font-bold text-slate-900 tabular-nums">
                {adherence.completed_tasks} of {adherence.total_tasks} Tasks Logged
              </div>
              <p className="text-slate-500 tabular-nums text-[11px]">
                {adherence.pending_tasks} remaining today
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`tactile-btn px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Quick Batch Action */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCompleteAllMorning}
              disabled={isBatchProcessing}
              className="tactile-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50/50 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Complete Morning Routine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task List Grouped by Time of Day */}
      <div className="space-y-6">
        {/* Morning Block */}
        {morningTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sun className="w-4 h-4 text-emerald-700" />
                <span>Morning Routine ({morningTasks.length})</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Scheduled 07:00 – 10:00</span>
            </div>
            <div className="space-y-2.5">
              {morningTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={handleToggle} isUpdating={completingTaskId === t.id} />
              ))}
            </div>
          </div>
        )}

        {/* Afternoon Block */}
        {afternoonTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sunset className="w-4 h-4 text-emerald-700" />
                <span>Afternoon Routine ({afternoonTasks.length})</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Scheduled 12:00 – 15:00</span>
            </div>
            <div className="space-y-2.5">
              {afternoonTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={handleToggle} isUpdating={completingTaskId === t.id} />
              ))}
            </div>
          </div>
        )}

        {/* Evening / Bedtime Block */}
        {eveningTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Moon className="w-4 h-4 text-emerald-700" />
                <span>Evening &amp; Bedtime Routine ({eveningTasks.length})</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Scheduled 18:00 – 21:00</span>
            </div>
            <div className="space-y-2.5">
              {eveningTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={handleToggle} isUpdating={completingTaskId === t.id} />
              ))}
            </div>
          </div>
        )}

        {/* As Needed (PRN) Block */}
        {prnTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>As-Needed &amp; Milestone Tasks ({prnTasks.length})</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Take or perform per clinical indication</span>
            </div>
            <div className="space-y-2.5">
              {prnTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={handleToggle} isUpdating={completingTaskId === t.id} />
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
            No tasks match your selected category filter.
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{
  task: CareTaskItem;
  onToggle: (t: CareTaskItem) => void;
  isUpdating: boolean;
}> = ({ task, onToggle, isUpdating }) => {
  const isDone = task.status === 'COMPLETED';

  return (
    <div
      onClick={() => onToggle(task)}
      className={`tactile-btn p-4 rounded-lg border transition cursor-pointer flex items-start gap-3.5 shadow-2xs select-none ${
        isDone 
          ? 'bg-emerald-50/20 border-slate-200 opacity-80' 
          : 'bg-white hover:bg-emerald-50/20 border-slate-200 hover:border-emerald-300'
      }`}
    >
      <button 
        type="button"
        disabled={isUpdating}
        className="mt-0.5 shrink-0 focus:outline-hidden cursor-pointer"
      >
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-600 transition" />
        )}
      </button>

      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.title}
          </span>
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {task.category}
          </span>
          {task.urgency === 'CRITICAL' && (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-800 text-white">
              Critical
            </span>
          )}
        </div>
        <p className={`text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-600'} leading-relaxed`}>
          {task.description}
        </p>
        <div className="text-[11px] text-slate-400 flex items-center gap-2 tabular-nums">
          <span>Frequency: <strong>{task.frequency}</strong></span>
          {isDone && (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              &bull; Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
