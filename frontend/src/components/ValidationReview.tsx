import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Quote, 
  ShieldCheck, 
  X,
  Clock,
  Pill,
  Calendar,
  ListTodo,
  ArrowRight,
  FileText,
  Search,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CarePlan, SafetyAuditResult, ValidationStatus } from '../types';

interface ValidationReviewProps {
  carePlan: CarePlan;
  safetyAudit: SafetyAuditResult;
  onValidateItem: (
    itemType: 'medication' | 'appointment' | 'task',
    itemId: string,
    newStatus: ValidationStatus,
    updatedFields?: Record<string, any>,
    clarificationNote?: string
  ) => Promise<void>;
  onProceedToCarePlan: () => void;
}

export const ValidationReview: React.FC<ValidationReviewProps> = ({
  carePlan,
  safetyAudit,
  onValidateItem,
  onProceedToCarePlan
}) => {
  const [activeCategory, setActiveCategory] = useState<'medications' | 'appointments' | 'tasks'>('medications');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLAGGED' | 'VALIDATED'>('ALL');
  const [isConfirmingAll, setIsConfirmingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const documentTextRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLElement>(null);

  // Auto-scroll to highlight when selectedSnippet changes
  useEffect(() => {
    if (selectedSnippet && highlightRef.current && documentTextRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedSnippet]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const startEdit = (item: any) => {
    setEditingItemId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditForm({});
  };

  const saveEdit = async (itemType: 'medication' | 'appointment' | 'task') => {
    if (!editingItemId) return;
    await onValidateItem(
      itemType,
      editingItemId,
      'HUMAN_VALIDATED',
      editForm,
      editForm.clarification_note
    );
    showToast(`Updated and validated ${editForm.name || editForm.title || 'item'}.`);
    setEditingItemId(null);
    setEditForm({});
  };

  const handleConfirmAll = async () => {
    setIsConfirmingAll(true);
    try {
      // Validate all medications that are not yet validated
      for (const med of carePlan.medications) {
        if (med.validation_status !== 'HUMAN_VALIDATED') {
          await onValidateItem('medication', med.id, 'HUMAN_VALIDATED');
        }
      }
      for (const task of carePlan.tasks) {
        if (task.validation_status !== 'HUMAN_VALIDATED') {
          await onValidateItem('task', task.id, 'HUMAN_VALIDATED');
        }
      }
      for (const apt of carePlan.appointments) {
        if (apt.validation_status !== 'HUMAN_VALIDATED') {
          await onValidateItem('appointment', apt.id, 'HUMAN_VALIDATED');
        }
      }
      showToast('All extracted items verified and confirmed!');
    } finally {
      setIsConfirmingAll(false);
    }
  };

  const selectItemForGrounding = (itemId: string, snippet?: string) => {
    setSelectedItemId(itemId);
    setSelectedSnippet(snippet || null);
  };

  // Render raw document with highlighted snippet
  const renderDocumentWithHighlight = () => {
    const raw = carePlan.raw_source_text || '';
    if (!selectedSnippet || !raw.toLowerCase().includes(selectedSnippet.toLowerCase().trim())) {
      return (
        <span className="text-slate-700 whitespace-pre-wrap">{raw}</span>
      );
    }

    const cleanSnippet = selectedSnippet.trim();
    const idx = raw.toLowerCase().indexOf(cleanSnippet.toLowerCase());
    if (idx === -1) {
      return <span className="text-slate-700 whitespace-pre-wrap">{raw}</span>;
    }

    const before = raw.slice(0, idx);
    const match = raw.slice(idx, idx + cleanSnippet.length);
    const after = raw.slice(idx + cleanSnippet.length);

    return (
      <span className="text-slate-700 whitespace-pre-wrap">
        {before}
        <mark
          ref={highlightRef}
          className="citation-highlight bg-emerald-100 text-emerald-950 font-semibold border border-emerald-300 rounded px-1"
        >
          {match}
        </mark>
        {after}
      </span>
    );
  };

  const renderBadge = (status: ValidationStatus) => {
    switch (status) {
      case 'HUMAN_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Verified
          </span>
        );
      case 'FLAGGED_AMBIGUOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <AlertTriangle className="w-3 h-3 text-slate-700" />
            Needs Clarification
          </span>
        );
      case 'AI_GENERATED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <FileText className="w-3 h-3 text-slate-400" />
            Draft Extraction
          </span>
        );
    }
  };

  // Filtered lists
  const filteredMeds = carePlan.medications.filter(m => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'FLAGGED') return m.validation_status === 'FLAGGED_AMBIGUOUS';
    if (statusFilter === 'VALIDATED') return m.validation_status === 'HUMAN_VALIDATED';
    return true;
  });

  const filteredApts = carePlan.appointments.filter(a => {
    if (searchQuery && !a.provider_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'FLAGGED') return a.validation_status === 'FLAGGED_AMBIGUOUS';
    if (statusFilter === 'VALIDATED') return a.validation_status === 'HUMAN_VALIDATED';
    return true;
  });

  const filteredTasks = carePlan.tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'FLAGGED') return t.validation_status === 'FLAGGED_AMBIGUOUS';
    if (statusFilter === 'VALIDATED') return t.validation_status === 'HUMAN_VALIDATED';
    return true;
  });

  const totalVerified = [
    ...carePlan.medications,
    ...carePlan.appointments,
    ...carePlan.tasks
  ].filter(i => i.validation_status === 'HUMAN_VALIDATED').length;

  const totalItems = carePlan.medications.length + carePlan.appointments.length + carePlan.tasks.length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Clinical Safety Audit Scorecard (Taste-Skill App Archetype) */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 font-semibold block">
              Human-in-the-Loop Validation Workspace
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Clinical Verification &amp; Ambiguity Clearance
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Every extracted medication, dosage, and task must be confirmed by the clinical staff or caregiver before entering active adherence tracking.
            </p>
          </div>

          {/* KPI Strip & Fast Batch Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Divided KPI Strip (Taste-Skill: Group, don't box) */}
            <div className="flex items-center divide-x divide-slate-200 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs shadow-2xs">
              <div className="px-3.5 text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Safety Score</span>
                <span className="text-lg font-bold text-emerald-700 tabular-nums">
                  {safetyAudit.safety_score}%
                </span>
              </div>
              <div className="px-3.5 text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Open Flags</span>
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {safetyAudit.ambiguities_count}
                </span>
              </div>
              <div className="px-3.5 text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Verified</span>
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {totalVerified} <span className="text-xs font-normal text-slate-400">/ {totalItems}</span>
                </span>
              </div>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmAll}
                disabled={isConfirmingAll || totalVerified === totalItems}
                className="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-emerald-50/50 border border-slate-300 rounded-md transition shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Verify all pending items in one click"
              >
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Confirm All Drafts</span>
              </button>

              <button
                type="button"
                onClick={onProceedToCarePlan}
                className="tactile-btn inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shadow-xs cursor-pointer"
              >
                <span>View Care Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Category Switcher, Filter & Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar: Category Tabs + Search + Filter */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategory('medications')}
                  className={`tactile-btn flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition cursor-pointer ${
                    activeCategory === 'medications'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Medications ({carePlan.medications.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory('appointments')}
                  className={`tactile-btn flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition cursor-pointer ${
                    activeCategory === 'appointments'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Appointments ({carePlan.appointments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory('tasks')}
                  className={`tactile-btn flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition cursor-pointer ${
                    activeCategory === 'tasks'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Tasks &amp; Monitoring ({carePlan.tasks.length})</span>
                </button>
              </div>

              {/* Status Filter Segment */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('FLAGGED')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    statusFilter === 'FLAGGED' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Needs Review
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('VALIDATED')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    statusFilter === 'VALIDATED' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Verified
                </button>
              </div>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Quick search clinical entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Items Content List */}
          <div className="space-y-3">
            {/* MEDICATIONS CATEGORY */}
            {activeCategory === 'medications' && (
              filteredMeds.length > 0 ? (
                filteredMeds.map((med) => {
                  const isEditing = editingItemId === med.id;
                  const isFlagged = med.validation_status === 'FLAGGED_AMBIGUOUS';
                  const isSelected = selectedItemId === med.id;

                  return (
                    <div 
                      key={med.id} 
                      onClick={() => selectItemForGrounding(med.id, med.source_snippet)}
                      className={`bg-white rounded-lg border p-4 transition duration-150 shadow-2xs cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/10'
                          : isFlagged
                          ? 'border-slate-400 bg-slate-50/40 hover:border-slate-500'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                              {med.dosage}
                            </span>
                            {renderBadge(med.validation_status)}
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ExternalLink className="w-2.5 h-2.5" />
                                Inspecting Source
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 flex items-center gap-2.5 flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {med.frequency}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span>Route: <strong className="text-slate-700">{med.route}</strong></span>
                            {med.is_prn && (
                              <span className="text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] border border-emerald-200">
                                PRN (As Needed)
                              </span>
                            )}
                          </div>

                          {med.special_instructions && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/80 leading-relaxed">
                              <strong>Clinical Instructions:</strong> {med.special_instructions}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div 
                          className="flex items-center gap-1.5 self-start shrink-0" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          {med.source_snippet && (
                            <button
                              type="button"
                              onClick={() => selectItemForGrounding(med.id, med.source_snippet)}
                              className={`tactile-btn p-1.5 rounded transition cursor-pointer ${
                                isSelected ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title="Highlight verbatim citation in source document"
                            >
                              <Quote className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => startEdit(med)}
                            className="tactile-btn p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit dosage or instructions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {med.validation_status !== 'HUMAN_VALIDATED' ? (
                            <button
                              type="button"
                              onClick={() => onValidateItem('medication', med.id, 'HUMAN_VALIDATED')}
                              className="tactile-btn px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onValidateItem('medication', med.id, 'FLAGGED_AMBIGUOUS', undefined, "Marked for doctor inquiry")}
                              className="tactile-btn px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                            >
                              Flag
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Flag Warning Card */}
                      {isFlagged && med.clarification_note && (
                        <div className="mt-3 p-3 bg-slate-100 border border-slate-300 rounded text-xs space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-800" />
                            <span>Clinical Verification Notice:</span>
                          </div>
                          <p className="text-slate-700">{med.clarification_note}</p>
                        </div>
                      )}

                      {/* Inline Edit Form */}
                      {isEditing && (
                        <div 
                          className="mt-3 pt-3 border-t border-slate-200 space-y-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Medication Name</label>
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Dosage / Strength</label>
                              <input
                                type="text"
                                value={editForm.dosage || ''}
                                onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                              <input
                                type="text"
                                value={editForm.frequency || ''}
                                onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Route</label>
                              <input
                                type="text"
                                value={editForm.route || ''}
                                onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="tactile-btn px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit('medication')}
                              className="tactile-btn px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                            >
                              Save &amp; Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
                  No medications found matching your filter criteria.
                </div>
              )
            )}

            {/* APPOINTMENTS CATEGORY */}
            {activeCategory === 'appointments' && (
              filteredApts.length > 0 ? (
                filteredApts.map((apt) => {
                  const isFlagged = apt.validation_status === 'FLAGGED_AMBIGUOUS';
                  const isSelected = selectedItemId === apt.id;

                  return (
                    <div 
                      key={apt.id} 
                      onClick={() => selectItemForGrounding(apt.id, apt.source_snippet)}
                      className={`bg-white rounded-lg border p-4 transition duration-150 shadow-2xs cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/10' 
                          : isFlagged 
                          ? 'border-slate-400 bg-slate-50/40 hover:border-slate-500' 
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{apt.provider_name}</h3>
                            {apt.specialty && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                {apt.specialty}
                              </span>
                            )}
                            {renderBadge(apt.validation_status)}
                          </div>
                          <p className="text-xs text-slate-700 font-medium">
                            Timeframe: <span className="text-emerald-800 font-semibold">{apt.timeframe_description}</span>
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed">{apt.purpose}</p>
                        </div>

                        <div 
                          className="flex items-center gap-1.5 self-start shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {apt.source_snippet && (
                            <button
                              type="button"
                              onClick={() => selectItemForGrounding(apt.id, apt.source_snippet)}
                              className="tactile-btn p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-emerald-50 transition cursor-pointer"
                              title="Show source text citation"
                            >
                              <Quote className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {apt.validation_status !== 'HUMAN_VALIDATED' ? (
                            <button
                              type="button"
                              onClick={() => onValidateItem('appointment', apt.id, 'HUMAN_VALIDATED')}
                              className="tactile-btn px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onValidateItem('appointment', apt.id, 'FLAGGED_AMBIGUOUS')}
                              className="tactile-btn px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                            >
                              Flag
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
                  No appointments found matching your filter criteria.
                </div>
              )
            )}

            {/* TASKS CATEGORY */}
            {activeCategory === 'tasks' && (
              filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isFlagged = task.validation_status === 'FLAGGED_AMBIGUOUS';
                  const isSelected = selectedItemId === task.id;

                  return (
                    <div 
                      key={task.id} 
                      onClick={() => selectItemForGrounding(task.id, task.source_snippet)}
                      className={`bg-white rounded-lg border p-4 transition duration-150 shadow-2xs cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/10' 
                          : isFlagged 
                          ? 'border-slate-400 bg-slate-50/40 hover:border-slate-500' 
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {task.category}
                            </span>
                            {renderBadge(task.validation_status)}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2.5">
                            <span>Frequency: <strong>{task.frequency}</strong></span>
                            <span className="text-slate-300">&bull;</span>
                            <span>Routine: <strong>{task.time_of_day}</strong></span>
                          </div>
                        </div>

                        <div 
                          className="flex items-center gap-1.5 self-start shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.source_snippet && (
                            <button
                              type="button"
                              onClick={() => selectItemForGrounding(task.id, task.source_snippet)}
                              className="tactile-btn p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-emerald-50 transition cursor-pointer"
                              title="Show source text citation"
                            >
                              <Quote className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {task.validation_status !== 'HUMAN_VALIDATED' ? (
                            <button
                              type="button"
                              onClick={() => onValidateItem('task', task.id, 'HUMAN_VALIDATED')}
                              className="tactile-btn px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onValidateItem('task', task.id, 'FLAGGED_AMBIGUOUS')}
                              className="tactile-btn px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                            >
                              Flag
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
                  No tasks found matching your filter criteria.
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: Source Provenance & Document Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Quote className="w-3.5 h-3.5 text-emerald-700" />
                <span>Source Grounding Inspector</span>
              </h2>
              {selectedSnippet && (
                <button
                  type="button"
                  onClick={() => { setSelectedSnippet(null); setSelectedItemId(null); }}
                  className="text-slate-400 hover:text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedSnippet ? (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-md text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-800 font-semibold text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Verbatim Document Citation:
                  </span>
                </div>
                <blockquote className="font-mono text-[11px] text-slate-800 border-l-2 border-emerald-600 pl-2 leading-relaxed bg-white p-2 rounded border border-emerald-100">
                  "{selectedSnippet}"
                </blockquote>
                <p className="text-[10px] text-slate-500">
                  Scrolled and highlighted in the original OCR text below.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                Click any medication card or quotation icon on the left to verify its exact source grounding in the scanned document.
              </p>
            )}

            {/* Document Text Pane with Live Highlight */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Original Document Text</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">OCR Output</span>
              </div>
              <div 
                ref={documentTextRef}
                className="max-h-96 overflow-y-auto p-3 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono leading-relaxed text-slate-800"
              >
                {renderDocumentWithHighlight()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
