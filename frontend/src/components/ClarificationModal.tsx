import React from 'react';
import { 
  X, 
  Printer, 
  HelpCircle, 
  AlertTriangle, 
  Stethoscope, 
  CheckCircle2,
  FileQuestion,
  User,
  Building2
} from 'lucide-react';
import { CarePlan, SafetyAuditResult } from '../types';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  carePlan: CarePlan;
  safetyAudit: SafetyAuditResult;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  carePlan,
  safetyAudit
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalQuestions = safetyAudit.flags.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-800/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
              <FileQuestion className="w-4 h-4 text-emerald-700" />
              <span>Doctor Visit Consultation Sheet</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Provider Clarification Questions
            </h2>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{carePlan.patient_name}</strong> &bull; Physician: <strong className="text-slate-800">{carePlan.primary_physician || 'Attending Physician'}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {totalQuestions === 0 ? (
            <div className="p-6 text-center text-xs space-y-2 bg-emerald-50/50 rounded border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
              <p className="font-bold text-slate-800">No unresolved clinical ambiguities</p>
              <p className="text-slate-600">All instructions, medication parameters, and appointment windows have been verified and reconciled.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                CareBridge flagged <span className="font-bold text-slate-800">{totalQuestions} clinical question(s)</span> for your physician or pharmacist to clarify during your next appointment:
              </p>

              <div className="space-y-3">
                {safetyAudit.flags.map((flag, idx) => (
                  <div key={idx} className="p-4 rounded border border-emerald-200 bg-emerald-50/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-slate-800">
                        {flag.item_type} &bull; {flag.ambiguity_type}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-emerald-800 text-white">
                        {flag.severity} Priority
                      </span>
                    </div>

                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                      &ldquo;{flag.suggested_clarification_question}&rdquo;
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Clinical Rationale: {flag.description}
                    </p>

                    {flag.source_snippet && (
                      <div className="p-2 bg-white rounded border border-slate-200 text-[10px] text-slate-600 font-mono">
                        Source Snippet: {flag.source_snippet}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Consultation Sheet</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
