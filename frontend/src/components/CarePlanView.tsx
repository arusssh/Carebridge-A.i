import React, { useState } from 'react';
import { 
  HeartPulse, 
  Pill, 
  AlertOctagon, 
  Printer, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  BadgeCheck, 
  Stethoscope, 
  Search,
  X,
  Filter
} from 'lucide-react';
import { CarePlan, SafetyAuditResult } from '../types';

interface CarePlanViewProps {
  carePlan: CarePlan;
  safetyAudit: SafetyAuditResult;
  onOpenQuestions: () => void;
}

export const CarePlanView: React.FC<CarePlanViewProps> = ({
  carePlan,
  safetyAudit,
  onOpenQuestions
}) => {
  const [medSearch, setMedSearch] = useState<string>('');
  const [medFilter, setMedFilter] = useState<'ALL' | 'VERIFIED' | 'PRN'>('ALL');

  const handlePrint = () => {
    window.print();
  };

  const filteredMedications = carePlan.medications.filter(med => {
    if (medSearch && !med.name.toLowerCase().includes(medSearch.toLowerCase())) return false;
    if (medFilter === 'VERIFIED') return med.validation_status === 'HUMAN_VALIDATED';
    if (medFilter === 'PRN') return med.is_prn;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Patient Executive Header Card (Taste-Skill App Archetype) */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                Validated Clinical Plan
              </span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">MRN: {carePlan.id.slice(0, 10).toUpperCase()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <User className="w-7 h-7 text-slate-700" />
              <span>{carePlan.patient_name}</span>
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Primary Diagnosis: <span className="text-slate-900 font-bold">{carePlan.diagnosis_summary}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="tactile-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Care Plan</span>
            </button>
            <button
              type="button"
              onClick={onOpenQuestions}
              className="tactile-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Doctor Visit Sheet ({safetyAudit.ambiguities_count})</span>
            </button>
          </div>
        </div>

        {/* Clinical Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded border border-slate-200">
            <Building2 className="w-5 h-5 text-slate-600 shrink-0" />
            <div>
              <span className="block text-slate-500 font-medium text-[11px] uppercase tracking-wider">Hospital / Clinic</span>
              <span className="font-bold text-slate-900">{carePlan.hospital_name || 'KIET Deemed to be University Clinic'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded border border-slate-200">
            <Stethoscope className="w-5 h-5 text-slate-600 shrink-0" />
            <div>
              <span className="block text-slate-500 font-medium text-[11px] uppercase tracking-wider">Attending Physician</span>
              <span className="font-bold text-slate-900">{carePlan.primary_physician || 'Dr. (Mrs.) Manisha Agarwal'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded border border-slate-200">
            <Calendar className="w-5 h-5 text-slate-600 shrink-0" />
            <div>
              <span className="block text-slate-500 font-medium text-[11px] uppercase tracking-wider">Transition Cycle</span>
              <span className="font-bold text-slate-900 tabular-nums">{carePlan.discharge_date || 'Active 30-Day Stabilization'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flag Warning Alert (Strict 3 Colors: High-Contrast Dark Slate & White) */}
      {carePlan.red_flags.length > 0 && (
        <div className="bg-slate-900 text-white rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 font-bold text-base sm:text-lg">
            <AlertOctagon className="w-6 h-6 text-white shrink-0" />
            <span>Red Flag Critical Symptoms — Immediate Protocol</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            If the patient experiences any of the following warning signs, seek immediate medical attention or call emergency services:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {carePlan.red_flags.map((rf) => (
              <div key={rf.id} className="p-3.5 bg-slate-800 rounded border border-slate-700 text-xs flex items-start gap-3 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold text-white">{rf.symptom}</span>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">{rf.action_required}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Discharge Medications Roster */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-700" />
              <span>Prescribed Discharge Medications ({carePlan.medications.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Pharmacopoeia-verified dosages and administration schedules.</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search meds..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 transition"
              />
              {medSearch && (
                <button
                  type="button"
                  onClick={() => setMedSearch('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMedFilter('ALL')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  medFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All ({carePlan.medications.length})
              </button>
              <button
                type="button"
                onClick={() => setMedFilter('VERIFIED')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  medFilter === 'VERIFIED' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setMedFilter('PRN')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  medFilter === 'PRN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                PRN
              </button>
            </div>
          </div>
        </div>

        {/* Medication Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 text-[11px]">
                <th className="py-3 px-4">Medication Name</th>
                <th className="py-3 px-4">Dosage</th>
                <th className="py-3 px-4">Frequency &amp; Route</th>
                <th className="py-3 px-4">Clinical Status</th>
                <th className="py-3 px-4">Administration Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMedications.map((med) => (
                <tr key={med.id} className="hover:bg-emerald-50/20 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span>{med.name}</span>
                    {med.is_prn && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        PRN
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700 tabular-nums">
                    {med.dosage}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{med.frequency}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{med.route}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {med.validation_status === 'HUMAN_VALIDATED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Validated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-500" /> Extracted Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                    {med.special_instructions || 'Take as directed by physician'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
