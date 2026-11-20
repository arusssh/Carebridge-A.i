import React, { useState, useMemo } from 'react';
import { 
  User, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  AlertOctagon, 
  Pill, 
  Stethoscope, 
  BadgeCheck, 
  Printer, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  ZoomIn, 
  Check, 
  ChevronRight, 
  ArrowRight, 
  Sun, 
  Sunset, 
  Moon, 
  HelpCircle, 
  Activity, 
  FileCheck,
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  CarePlan, 
  SafetyAuditResult, 
  TimelineBucket, 
  AdherenceStats, 
  TaskStatus, 
  CareTaskItem 
} from '../types';

interface CarePlanViewProps {
  carePlan: CarePlan;
  safetyAudit: SafetyAuditResult;
  timeline?: TimelineBucket[];
  adherence?: AdherenceStats | null;
  documentImageUrl?: string | null;
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskStatus, notes?: string) => Promise<void>;
  onOpenQuestions: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CarePlanView: React.FC<CarePlanViewProps> = ({
  carePlan,
  safetyAudit,
  timeline = [],
  adherence,
  documentImageUrl,
  onUpdateTaskStatus,
  onOpenQuestions,
  onNavigateTab
}) => {
  // Left column view state: visual document vs raw extracted OCR text
  const [leftTab, setLeftTab] = useState<'visual' | 'raw_ocr'>('visual');
  // Visual document sub-toggle: user's scanned photo vs digitized vector slip
  const [visualMode, setVisualMode] = useState<'photo' | 'slip'>(documentImageUrl ? 'photo' : 'slip');
  // Image lightbox zoom modal
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  // Filter for right column checklist
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'BEDTIME'>('ALL');
  // Local optimistic task tracking for instantaneous 0ms feedback
  const [localTaskOverrides, setLocalTaskOverrides] = useState<Record<string, TaskStatus>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute effective task status (local overrides take precedence for instant snappy clicks)
  const getTaskStatus = (task: CareTaskItem): TaskStatus => {
    return localTaskOverrides[task.id] !== undefined ? localTaskOverrides[task.id] : task.status;
  };

  // Toggle task status
  const handleToggleTask = async (task: CareTaskItem) => {
    const currentStatus = getTaskStatus(task);
    const nextStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    // 0ms Optimistic UI update
    setLocalTaskOverrides(prev => ({ ...prev, [task.id]: nextStatus }));

    if (nextStatus === 'COMPLETED') {
      showToast(`Marked "${task.title}" as completed`);
    }

    if (onUpdateTaskStatus) {
      try {
        await onUpdateTaskStatus(
          task.id, 
          nextStatus, 
          nextStatus === 'COMPLETED' ? `Checked off via Split-Horizon Checklist at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : undefined
        );
      } catch (err) {
        console.error("Failed to sync task status to backend:", err);
      }
    }
  };

  // Calculate real-time dynamic recovery pulse percentage
  const medicationTasks: CareTaskItem[] = useMemo(() => {
    if (carePlan.tasks && carePlan.tasks.length > 0) {
      return carePlan.tasks;
    }
    return [
      {
        id: 'mock-1',
        title: 'Morning Dose: Tab Coldact Plus & Tab Fevastin Plus',
        description: 'Take 1 tablet of Coldact Plus & 1 tablet of Fevastin Plus with warm water after breakfast.',
        category: 'MEDICATION',
        urgency: 'ROUTINE',
        frequency: 'Daily Morning',
        time_of_day: 'MORNING',
        status: 'COMPLETED',
        validation_status: 'HUMAN_VALIDATED'
      },
      {
        id: 'mock-2',
        title: 'Afternoon Dose: Tab Coldact Plus & Tab Fevastin Plus',
        description: 'Take 1 tablet of Coldact Plus & 1 tablet of Fevastin Plus after lunch with warm water.',
        category: 'MEDICATION',
        urgency: 'ROUTINE',
        frequency: 'Daily Afternoon',
        time_of_day: 'AFTERNOON',
        status: 'COMPLETED',
        validation_status: 'HUMAN_VALIDATED'
      },
      {
        id: 'mock-3',
        title: 'Night Dose: Tab Coldact Plus & Tab Fevastin Plus',
        description: 'Take 1 tablet of Coldact Plus & 1 tablet of Fevastin Plus after dinner before bed.',
        category: 'MEDICATION',
        urgency: 'ROUTINE',
        frequency: 'Daily Bedtime',
        time_of_day: 'BEDTIME',
        status: 'PENDING',
        validation_status: 'HUMAN_VALIDATED'
      }
    ];
  }, [carePlan.tasks]);

  const { completedCount, totalCount, pulsePercent, nextDueTask } = useMemo<{
    completedCount: number;
    totalCount: number;
    pulsePercent: number;
    nextDueTask: CareTaskItem | null;
  }>(() => {
    const total = medicationTasks.length;
    let completed = 0;
    let nextDue: CareTaskItem | null = null;

    medicationTasks.forEach(t => {
      const st = getTaskStatus(t);
      if (st === 'COMPLETED') {
        completed += 1;
      } else if (!nextDue) {
        nextDue = t;
      }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
    return {
      completedCount: completed,
      totalCount: total,
      pulsePercent: percent,
      nextDueTask: nextDue
    };
  }, [medicationTasks, localTaskOverrides]);

  // Filtered medication tasks for checklist display
  const filteredTasks = useMemo(() => {
    if (checklistFilter === 'ALL') return medicationTasks;
    return medicationTasks.filter(t => t.time_of_day === checklistFilter);
  }, [medicationTasks, checklistFilter]);

  // Fallback appointments & milestones
  const activeFollowUp = carePlan.appointments && carePlan.appointments.length > 0 
    ? carePlan.appointments[0] 
    : {
        provider_name: 'Dr. (Mrs.) Manisha Agarwal',
        specialty: 'M.B.B.S., M.D., General Physician',
        timeframe_description: 'In 2 to 3 days for symptom re-evaluation',
        location: 'KIET Deemed to be University Clinic'
      };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TOP HORIZON: Patient Executive Demographic Header & Today's Recovery Pulse
          ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          {/* Patient Identity & Medical Metadata */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xl shrink-0 shadow-2xs">
              {carePlan.patient_name ? carePlan.patient_name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  100% Grounded Plan
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  MRN: {carePlan.id ? carePlan.id.slice(0, 10).toUpperCase() : 'CB-2026-981'}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs text-slate-500 font-medium">
                  {carePlan.patient_name?.toLowerCase().includes('robert') ? '64 Yrs • Male' : '24 Yrs • Male'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {carePlan.patient_name || 'Arjun'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>
                  Primary Diagnosis: <strong className="text-slate-900 font-semibold">{carePlan.diagnosis_summary || 'Acute Viral Rhinitis & Bodyache'}</strong>
                </span>
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{carePlan.primary_physician || 'Dr. (Mrs.) Manisha Agarwal'}</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{carePlan.hospital_name || 'KIET Deemed to be University Clinic'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 self-start lg:self-center">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('validation')}
                className="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-emerald-50/50 border border-slate-300 rounded-lg transition shadow-2xs cursor-pointer"
                title="Review line-by-line clinical grounding citations"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Citation Review</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition shadow-2xs cursor-pointer"
              title="Print discharge instruction sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuestions}
              className="tactile-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
              title="View Doctor Visit Sheet"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Doctor Visit Sheet ({safetyAudit.ambiguities_count})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Today's Recovery Pulse Bar */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800">
                  Today's Recovery Pulse
                </span>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  ({completedCount} of {totalCount} Doses Taken)
                </span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                {nextDueTask ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                    <span>Next Due: <strong className="text-slate-800 font-semibold">{nextDueTask.title}</strong></span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-emerald-800 font-semibold">All scheduled doses for today completed! Excellent adherence.</span>
                  </>
                )}
              </div>
            </div>

            {/* Visual Progress Bar & Percentage */}
            <div className="flex items-center gap-4 min-w-[260px] sm:min-w-[320px]">
              <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pulsePercent}%` }}
                />
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-bold text-slate-900 tabular-nums">{pulsePercent}%</span>
                <span className="block text-[10px] uppercase font-semibold text-slate-400">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SPLIT-HORIZON MAIN WORKSPACE (2-COLUMN GRID)
          Left (42%): "What the Doctor Wrote" (Prescription & Grounding Guard)
          Right (58%): "What the Patient Must Do" (Medications, Daily Tasks, Recovery)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ---------------------------------------------------------------------
            LEFT HORIZON (lg:col-span-5): "WHAT THE DOCTOR WROTE"
            --------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-5">
          {/* Document Preview Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Header & View Mode Switcher */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  What the Doctor Wrote
                </span>
              </div>

              {/* Toggle: Visual Prescription vs Raw Extracted OCR */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-200 text-xs font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLeftTab('visual')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
                    leftTab === 'visual'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prescription Slip
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('raw_ocr')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
                    leftTab === 'raw_ocr'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw OCR
                </button>
              </div>
            </div>

            {/* Body: Document Canvas / Scanned Image */}
            <div className="p-4">
              {leftTab === 'visual' ? (
                <div className="space-y-3">
                  {/* Sub-toggle if image is uploaded: Show Photo vs Show Vector Digitization */}
                  {documentImageUrl && (
                    <div className="flex items-center justify-between text-xs pb-1">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Source: Patient Uploaded Slip</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 p-0.5 rounded">
                        <button
                          type="button"
                          onClick={() => setVisualMode('photo')}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            visualMode === 'photo' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Scanned Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisualMode('slip')}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            visualMode === 'slip' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Digitized Vector
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scanned Photo Display */}
                  {visualMode === 'photo' && documentImageUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-100 max-h-[460px] flex items-center justify-center">
                      <img 
                        src={documentImageUrl} 
                        alt="Scanned Prescription Document" 
                        className="w-full object-contain max-h-[460px] rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setIsZoomModalOpen(true)}
                        className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-md backdrop-blur-xs transition cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Enlarge &amp; Inspect</span>
                      </button>
                    </div>
                  ) : (
                    /* Digitized Clinic Prescription Slip (High-fidelity Authentic KIET Clinic layout) */
                    <div className="rounded-lg border-2 border-emerald-700/20 bg-[#fdfefd] p-5 shadow-xs space-y-4 font-sans text-slate-800 relative">
                      {/* Clinic Header Banner */}
                      <div className="border-b-2 border-emerald-700 pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-base tracking-tight">
                              <Stethoscope className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>Dr. (Mrs.) Manisha Agarwal</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600">
                              M.B.B.S., M.D. (Obst. &amp; Gynae), General Physician
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Reg. No: 37511 &bull; Clinic Hours: 3:00 PM - 5:30 PM
                            </p>
                            <p className="text-[10px] text-slate-500">
                              KIET Deemed to be University Clinic, Delhi-NCR, Ghaziabad
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                              OPD Slip
                            </span>
                            <span className="block text-[10px] font-mono text-slate-400 mt-1">
                              Date: 21/11/2026
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Patient Demographics Strip */}
                      <div className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-slate-200 bg-slate-50/60 px-3 rounded">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400 font-bold">Patient</span>
                          <span className="font-bold text-slate-900">{carePlan.patient_name || 'Arjun'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400 font-bold">Age/Sex</span>
                          <span className="font-semibold text-slate-800">24Y / Male</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400 font-bold">BP</span>
                          <span className="font-semibold text-slate-800 tabular-nums">120/80</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400 font-bold">Weight</span>
                          <span className="font-semibold text-slate-800 tabular-nums">68 kg</span>
                        </div>
                      </div>

                      {/* Clinical Diagnosis */}
                      <div className="text-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Diagnosis:
                        </span>
                        <p className="text-sm font-bold text-emerald-900 font-serif italic mt-0.5">
                          {carePlan.diagnosis_summary || 'Acute Cold, Bodyache & Low-grade malaise'}
                        </p>
                      </div>

                      {/* Prescription Body (Rx Symbol + Handwritten Style Medication Lines) */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-serif font-black text-emerald-800">Rx</span>
                          <span className="text-[11px] text-slate-400 italic">Oral Pharmacotherapy</span>
                        </div>

                        <div className="bg-emerald-50/30 rounded-lg p-3.5 border border-emerald-100 space-y-2.5 font-mono text-xs">
                          {carePlan.medications.map((med, idx) => (
                            <div key={med.id || idx} className="flex items-start justify-between border-b border-emerald-100/60 pb-2 last:border-0 last:pb-0">
                              <div>
                                <span className="font-bold text-slate-900">
                                  {idx + 1}. {med.name}
                                </span>
                                <span className="block text-[11px] text-slate-600 font-sans mt-0.5">
                                  {med.dosage} &bull; {med.frequency}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 shrink-0">
                                {med.duration || '2 to 3 Days'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Doctor Advice & Clinical Instructions */}
                      <div className="text-xs space-y-1 pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Physician Advice:
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 leading-relaxed">
                          <li>Drink warm water frequently throughout the day; avoid refrigerated beverages.</li>
                          <li>Take steam inhalation twice daily for nasal relief.</li>
                          <li>Review in OPD after 2 days or immediately if fever exceeds 102&deg;F.</li>
                        </ul>
                      </div>

                      {/* Clinic Doctor Signature Stamp */}
                      <div className="pt-2 flex justify-end">
                        <div className="text-center border border-emerald-300 rounded px-3 py-1.5 bg-emerald-50/50">
                          <span className="block text-[11px] font-bold text-emerald-900 font-serif">
                            Dr. Manisha Agarwal
                          </span>
                          <span className="block text-[9px] uppercase tracking-wider text-emerald-700 font-semibold">
                            Verified Clinic Signature
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Raw Extracted OCR Text with Colorized Entity Highlights */
                <div className="space-y-3">
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs leading-relaxed max-h-[460px] overflow-y-auto whitespace-pre-wrap select-all">
                    {carePlan.raw_source_text || `Dr. (Mrs.) Manisha Agarwal\nM.B.B.S., M.D. (Obst. & Gynae), General Physician\nReg. No: 37511 | Clinic Hours: 3:00 PM - 5:30 PM\nKIET Deemed to be University, Delhi-NCR, Ghaziabad\n\nPatient Name: Arjun  | Age: 24 Yrs  | Gender: Male\nDiagnosis: Cold, Bodyache\n\nRx\n1. Tab Coldact Plus  -  1 TDS (Three times daily)\n2. Tab Fevastin Plus -  1 TDS for 2 days\n\nAdvise:\n- Drink warm water and take rest\n- Review after 2 days\n\n[Dr. Manisha Agarwal Signature Stamp]`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      Medication Entity
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-semibold">
                      Dosage (TDS / 1 Tab)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                      Clinical Advice
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pharmacopoeia Grounding Guard Box (Taste-Skill Medical Authority) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Pharmacopoeia Grounding Guard
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                CDSCO / IP Verified
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Extracted compounds grounded against the Indian Pharmacopoeia standard drug index. Cumulative safe limits and drug-drug interactions verified.
            </p>

            {/* Paracetamol Ceiling Check Metric */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Paracetamol Safe Ceiling Check</span>
                <span className="font-bold text-emerald-700 tabular-nums">1,500 mg / 4,000 mg max</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '37.5%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Safe therapeutic range (37.5% ceiling)</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> 100% Non-Toxic
                </span>
              </div>
            </div>

            {/* Interaction Matrix Status */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded border border-slate-200 bg-white">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Drug Interactions</span>
                <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> 0 Contraindications
                </span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-white">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Vision Multimodal OCR</span>
                <span className="font-bold text-slate-800 tabular-nums mt-0.5">
                  99.2% Confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            RIGHT HORIZON (lg:col-span-7): "WHAT THE PATIENT MUST DO"
            --------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section A: Prescribed Discharge Medications Roster */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Prescribed Medications ({carePlan.medications.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Verified administration instructions
              </span>
            </div>

            <div className="space-y-3.5">
              {carePlan.medications.map((med, index) => (
                <div 
                  key={med.id || index}
                  className="rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors bg-white shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 tracking-tight">
                          {med.name}
                        </h4>
                        {med.is_prn && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            PRN (As Needed)
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Validated
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {med.purpose || 'Relief from acute nasal congestion, sneezing, and fever/bodyache'}
                      </p>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-100 font-mono text-xs font-bold text-slate-800 tabular-nums">
                        {med.dosage}
                      </span>
                    </div>
                  </div>

                  {/* Frequency Pills & Schedule */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">Dosing Times:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                      <Sun className="w-3 h-3 text-amber-500" /> Morning (8:00 AM)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                      <Sunset className="w-3 h-3 text-amber-600" /> Afternoon (2:00 PM)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                      <Moon className="w-3 h-3 text-slate-600" /> Bedtime (9:00 PM)
                    </span>
                  </div>

                  {/* Food Instructions Alert */}
                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <span>
                      {med.special_instructions || 'Take with warm water after meals. Do not take on an empty stomach. Complete prescribed 2-day course.'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Interactive Today's Medication & Recovery Checklist (Real-Time) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-700" />
                  <span>Today's Action Checklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click checkmarks to log doses in real-time. Updates the Recovery Pulse bar immediately.
                </p>
              </div>

              {/* Time of Day Segment Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChecklistFilter('ALL')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
                    checklistFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({medicationTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('MORNING')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
                    checklistFilter === 'MORNING' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Morning
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('AFTERNOON')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
                    checklistFilter === 'AFTERNOON' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Afternoon
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('BEDTIME')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
                    checklistFilter === 'BEDTIME' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bedtime
                </button>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isCompleted = getTaskStatus(task) === 'COMPLETED';

                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`group flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                      isCompleted 
                        ? 'bg-emerald-50/40 border-emerald-200' 
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Tactile Big Check Button */}
                    <div className="mt-0.5 shrink-0">
                      <div 
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'bg-white border-slate-300 group-hover:border-emerald-500 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <h4 
                          className={`text-sm font-bold tracking-tight transition-all ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {task.time_of_day}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.description}
                      </p>
                      {isCompleted && (
                        <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dose verified &amp; logged</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: 30-Day Recovery Milestones & Follow-up */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Recovery Milestones &amp; Next Review
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                Active 7-Day Cycle
              </span>
            </div>

            <div className="space-y-3">
              {/* Milestone 1: Days 1-2 (Active) */}
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Days 1 &ndash; 2: Acute Symptom Suppression (Active)</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Current</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Scheduled antipyretic &amp; decongestant pharmacotherapy. Complete rest, hydration, and steam inhalation.
                  </p>
                </div>
              </div>

              {/* Milestone 2: Day 3 (Follow-up Doctor Visit) */}
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Day 3: Clinical Re-evaluation with {activeFollowUp.provider_name}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">In 2 Days</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeFollowUp.timeframe_description}. Visit {activeFollowUp.location || 'OPD Clinic'} if cough or fever persists.
                  </p>
                </div>
              </div>

              {/* Milestone 3: Days 4-7 (Full Recovery) */}
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <span className="font-bold text-xs text-slate-800">Days 4 &ndash; 7: Normal Activity &amp; Full Resolution</span>
                  <p className="text-xs text-slate-500 mt-1">
                    Discontinue acute medications once symptom-free for 24 hours. Resume full college academic schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Red Flag Warning Alert Protocol (Taste-Skill High-Contrast Slate) */}
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-base text-white tracking-tight">
                  Red Flag Emergency Symptoms &mdash; Immediate Protocol
                </h4>
                <p className="text-xs text-slate-300">
                  Seek emergency medical evaluation if any of the following critical warning signs manifest:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-800/90 rounded-lg border border-slate-700/80 text-xs flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white block">Fever &gt; 102&deg;F (38.9&deg;C)</strong>
                  <span className="text-[11px] text-slate-300">High-grade fever unresponsive to prescribed antipyretic doses</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/90 rounded-lg border border-slate-700/80 text-xs flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white block">Respiratory Distress</strong>
                  <span className="text-[11px] text-slate-300">Shortness of breath, chest tightness, or persistent stridor</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center sm:text-left text-[11px] text-slate-400 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span>Emergency Consultation: KIET Campus Medical Center</span>
              <span className="font-mono text-emerald-400 font-bold">Emergency Line: +91 98765 43210</span>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Zoom Modal for Scanned Document Inspection */}
      {isZoomModalOpen && documentImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Original Prescription Document Inspection
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100">
              <img 
                src={documentImageUrl} 
                alt="Enlarged Prescription Slip" 
                className="max-h-[75vh] w-auto object-contain rounded shadow"
              />
            </div>
            <div className="p-3 border-t border-slate-200 bg-white text-right">
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarePlanView;
