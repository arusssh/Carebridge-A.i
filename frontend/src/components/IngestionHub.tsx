import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { PresetCase } from '../types';
import { fetchPresets, fetchPreset } from '../api/client';

interface IngestionHubProps {
  onIngest: (rawText: string, patientName: string, presetId?: string) => Promise<void>;
  isLoading: boolean;
  defaultPatientName?: string;
}

export const IngestionHub: React.FC<IngestionHubProps> = ({ onIngest, isLoading, defaultPatientName }) => {
  const [presets, setPresets] = useState<PresetCase[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [patientName, setPatientName] = useState<string>(defaultPatientName || 'Arjun');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPresets()
      .then((data) => {
        setPresets(data);
      })
      .catch((err) => console.error("Could not fetch presets:", err));
  }, []);

  useEffect(() => {
    if (defaultPatientName && !selectedPresetId) {
      setPatientName(defaultPatientName);
    }
  }, [defaultPatientName, selectedPresetId]);

  const handleSelectPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    setErrorMsg(null);
    try {
      const fullCase = await fetchPreset(presetId);
      setRawText(fullCase.raw_text);
      setPatientName(fullCase.patient_name || 'Patient');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading preset');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.trim().length < 20) {
      setErrorMsg("Please provide clinical discharge or instruction text to extract.");
      return;
    }
    setErrorMsg(null);
    await onIngest(rawText, patientName, selectedPresetId || undefined);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Title & Context */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 font-semibold block mb-1">
              Clinical Document Intake
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Transform Clinical Notes into Structured Care Plans
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
              Parse physician discharge summaries, prescriptions, or post-operative instructions. CareBridge extracts active medications, timelines, and monitoring tasks while flagging ambiguities for human confirmation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Zero-Hallucination Protocol Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clinical Vignettes Directory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Reference Clinical Cases</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">{presets.length} Presets</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Select a pre-validated clinical vignette to test extraction accuracy and ambiguity detection:
            </p>

            <div className="space-y-2">
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    type="button"
                    className={`w-full text-left p-3 rounded-md border transition text-xs cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-800 leading-snug">{preset.title}</span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                      <span className="font-mono text-slate-700 font-medium">{preset.category}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500">{preset.patient_name}, {preset.patient_age}y</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Protocol Assurance */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Clinical Safety Safeguards</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              The extraction engine strictly grounds every item to its source citation. Vague frequencies or unspecified medication dosages are flagged for provider clarification rather than assumed.
            </p>
          </div>
        </div>

        {/* Right Column: Ingestion Document Workspace */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Clinical Text Document Workspace</span>
                </h2>
                <p className="text-[11px] text-slate-500">Paste or edit raw discharge documentation or outpatient notes.</p>
              </div>

              <div className="w-full sm:w-56">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  placeholder="e.g. Arjun"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-slate-100 border border-slate-300 text-slate-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-700" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-600">
                <span className="font-semibold">Medical Record Content</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 tabular-nums">{rawText.length} characters</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setSelectedPresetId('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Clear Text
                  </button>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setSelectedPresetId('');
                }}
                rows={15}
                className="w-full p-3.5 border border-slate-300 rounded-md text-xs font-mono leading-relaxed text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition"
                placeholder="Paste physician notes, medication orders, or hospital discharge summary here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Extracted items proceed directly to Human Clinical Validation with full source provenance.
              </span>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-2xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Extraction...</span>
                  </>
                ) : (
                  <>
                    <span>Extract &amp; Structure Care Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
