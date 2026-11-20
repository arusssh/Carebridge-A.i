import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Stethoscope,
  FlaskConical,
  Scissors,
  Pill,
  ClipboardList,
  Milestone,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Circle
} from 'lucide-react';
import { CarePlan, TimelineBucket } from '../types';

interface TimelineViewProps {
  carePlan: CarePlan;
  timeline: TimelineBucket[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  carePlan,
  timeline
}) => {
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [copiedAptId, setCopiedAptId] = useState<string | null>(null);
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({
    'prep-1': true,
    'prep-2': false,
    'prep-3': false
  });

  const handleCopyAppointment = (apt: any) => {
    const text = `Medical Appointment: ${apt.provider_name} (${apt.specialty || 'Consultation'})\nTimeframe: ${apt.timeframe_description}\nPurpose: ${apt.purpose}\nLocation: ${apt.location || 'Outpatient Clinic'}`;
    navigator.clipboard.writeText(text);
    setCopiedAptId(apt.id);
    setTimeout(() => setCopiedAptId(null), 2500);
  };

  const toggleChecklistItem = (key: string) => {
    setPrepChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredTimeline = timeline.filter(bucket => {
    if (selectedPhaseFilter === 'ALL') return true;
    if (selectedPhaseFilter === 'IMMEDIATE') {
      return bucket.phase.toLowerCase().includes('day 0') || bucket.phase.toLowerCase().includes('immediate') || bucket.phase.toLowerCase().includes('day 1');
    }
    if (selectedPhaseFilter === 'WEEK1_2') {
      return bucket.phase.toLowerCase().includes('week 1') || bucket.phase.toLowerCase().includes('week 2') || bucket.phase.toLowerCase().includes('days 4');
    }
    if (selectedPhaseFilter === 'LONGTERM') {
      return bucket.phase.toLowerCase().includes('30') || bucket.phase.toLowerCase().includes('chronic') || bucket.phase.toLowerCase().includes('ongoing');
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 font-semibold block mb-1">
              Chronological Care Trajectory
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Recovery Timeline &amp; Consultations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Step-by-step milestone progression from acute hospital discharge through 30-day clinical stabilization.
            </p>
          </div>

          {/* Interactive Phase Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedPhaseFilter('ALL')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                selectedPhaseFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Phases
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhaseFilter('IMMEDIATE')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                selectedPhaseFilter === 'IMMEDIATE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Days 0–3
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhaseFilter('WEEK1_2')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                selectedPhaseFilter === 'WEEK1_2' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Days 4–14
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhaseFilter('LONGTERM')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                selectedPhaseFilter === 'LONGTERM' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day 30+
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Provider Follow-ups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-700" />
            <span>Scheduled Provider Follow-ups ({carePlan.appointments.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Tap cards to copy or review appointment prep notes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carePlan.appointments.map((apt) => {
            const isCopied = copiedAptId === apt.id;
            const isExpanded = expandedAptId === apt.id;

            return (
              <div 
                key={apt.id} 
                className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3 relative overflow-hidden transition hover:border-emerald-300"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
                
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                      {apt.specialty || 'Clinical Follow-up'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {apt.provider_name}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800 tabular-nums flex items-center gap-1 shrink-0 border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Day ~{apt.target_day_offset || 14}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">
                    Target Window: <strong className="text-emerald-700">{apt.timeframe_description}</strong>
                  </p>
                  <p className="text-slate-600 leading-normal">{apt.purpose}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{apt.location || 'Outpatient Clinic / Surgery Center'}</span>
                  </div>
                </div>

                {/* Interactive Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopyAppointment(apt)}
                    className="tactile-btn inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium transition cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span className="text-emerald-800 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Details</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedAptId(isExpanded ? null : apt.id)}
                    className="tactile-btn inline-flex items-center gap-1 text-emerald-800 font-semibold hover:text-emerald-900 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Checklist' : 'Prep Checklist'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expandable Interactive Pre-Visit Checklist */}
                {isExpanded && (
                  <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-2 animate-in fade-in duration-150">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
                      Pre-Appointment Checklist:
                    </span>
                    <div className="space-y-1.5">
                      <label 
                        onClick={() => toggleChecklistItem('prep-1')}
                        className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900"
                      >
                        {prepChecklist['prep-1'] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className={prepChecklist['prep-1'] ? 'line-through text-slate-400' : ''}>
                          Bring discharge summary &amp; prescription slip
                        </span>
                      </label>

                      <label 
                        onClick={() => toggleChecklistItem('prep-2')}
                        className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900"
                      >
                        {prepChecklist['prep-2'] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className={prepChecklist['prep-2'] ? 'line-through text-slate-400' : ''}>
                          Record recent blood pressure &amp; temperature log
                        </span>
                      </label>

                      <label 
                        onClick={() => toggleChecklistItem('prep-3')}
                        className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700 hover:text-slate-900"
                      >
                        {prepChecklist['prep-3'] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className={prepChecklist['prep-3'] ? 'line-through text-slate-400' : ''}>
                          Bring printed Doctor Clarification Sheet
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Roadmap Timeline */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Milestone className="w-5 h-5 text-slate-700" />
            <span>Milestone Recovery Phases</span>
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">
            Showing {filteredTimeline.length} of {timeline.length} Phase Blocks
          </span>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500 text-xs space-y-1">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No events found for this phase filter.</p>
            <p className="text-[11px] text-slate-400">Select &ldquo;All Phases&rdquo; to see the full 30-day care trajectory.</p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredTimeline.map((bucket, bIdx) => (
              <div key={bIdx} className="relative">
                {/* Timeline Step Indicator */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-2xs tabular-nums">
                  {bIdx + 1}
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      {bucket.phase}
                    </h3>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded tabular-nums">
                      {bucket.events.length} Milestones
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {bucket.events.map((evt) => (
                      <div 
                        key={evt.id} 
                        className="p-3.5 rounded border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded bg-white border border-slate-200 text-slate-700 shrink-0 mt-0.5">
                            {evt.type === 'APPOINTMENT' && <Stethoscope className="w-4 h-4 text-emerald-700" />}
                            {evt.type === 'LAB_MILESTONE' && <FlaskConical className="w-4 h-4 text-slate-700" />}
                            {evt.type === 'PROCEDURE_MILESTONE' && <Scissors className="w-4 h-4 text-slate-700" />}
                            {evt.type === 'MEDICATION_COMPLETION' && <Pill className="w-4 h-4 text-emerald-700" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{evt.title}</div>
                            <div className="text-[11px] font-semibold text-emerald-700">{evt.subtitle}</div>
                            <p className="text-slate-600 text-[11px] mt-1 leading-normal">{evt.details}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white border border-slate-200 text-slate-700 tabular-nums">
                            {evt.timeframe}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
