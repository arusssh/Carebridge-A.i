import React, { useState, useRef } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  FileCheck,
  Eye,
  Stethoscope,
  Sparkles,
  FileText
} from 'lucide-react';
import { uploadDocument, IngestResponse } from '../api/client';

interface DocumentScannerProps {
  onScanComplete: (response: IngestResponse) => void;
  patientName?: string;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onScanComplete,
  patientName
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('carebridge_gemini_model') || 'gemini-3.5-flash-lite';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessScan = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select or drop a prescription image or discharge PDF first.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStep('Preprocessing medical document & zoning column layout...');

    const stepTimer1 = setTimeout(() => {
      setProcessingStep(`Deciphering handwriting with Google Gemini 3.5 Lite...`);
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setProcessingStep('Grounding medications against clinical pharmacopoeia...');
    }, 2400);

    try {
      const savedKey = localStorage.getItem('carebridge_gemini_api_key') || undefined;
      const res = await uploadDocument(selectedFile, patientName, savedKey, selectedModel);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      onScanComplete(res);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setErrorMsg(err.message || "Failed to process medical document.");
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const loadSamplePrescription = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 750;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Cream-white medical prescription paper
      ctx.fillStyle = '#fcfdfa';
      ctx.fillRect(0, 0, 750, 800);

      // Clinic Header Border
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 15, 720, 770);

      // Printed Clinic Header
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.fillText('Dr. (Mrs.) Manisha Agarwal', 35, 55);
      
      ctx.fillStyle = '#334155';
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText('M.B.B.S., M.D. (Obst. & Gynae), General Physician', 35, 78);
      ctx.fillText('Reg. No: 37511 | Clinic Hours: 3:00 PM - 5:30 PM', 35, 96);
      ctx.fillText('E-mail: drvamsag@gmail.com | Phone: +91 98765 43210', 35, 114);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 128);
      ctx.lineTo(720, 128);
      ctx.stroke();

      // Patient Details Row
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.fillText('Patient Name:', 35, 155);
      ctx.fillText('Age:', 320, 155);
      ctx.fillText('Gender:', 420, 155);
      ctx.fillText('BP:', 540, 155);
      ctx.fillText('Date:', 630, 155);

      // Handwritten fills in clinic pen
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'italic 16px "Comic Sans MS", "Caveat", cursive, sans-serif';
      const activePatient = patientName && patientName !== 'Patient' ? patientName : 'Arjun';
      ctx.fillText(activePatient, 125, 155);
      ctx.fillText('21 Yrs', 355, 155);
      ctx.fillText('Male', 475, 155);
      ctx.fillText('120/80', 568, 155);
      ctx.fillText('Today', 670, 155);

      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(30, 175);
      ctx.lineTo(720, 175);
      ctx.stroke();

      // Clinical Diagnosis
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillText('Diagnosis / Symptoms:', 35, 205);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'italic 15px "Comic Sans MS", cursive, sans-serif';
      ctx.fillText('Cold, Bodyache', 205, 205);

      // Rx Symbol
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 28px serif';
      ctx.fillText('Rx', 35, 260);

      // Handwritten Medications
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'italic 16px "Comic Sans MS", "Caveat", cursive, sans-serif';
      ctx.fillText('1. Tab Coldact Plus  —  1 TDS (Three times daily)', 55, 305);
      ctx.fillText('2. Tab Fevastin Plus  —  1 TDS for 2 days', 55, 355);

      // Advice & Tasks
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillText('Advise & Daily Care:', 35, 430);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'italic 15px "Comic Sans MS", cursive, sans-serif';
      ctx.fillText('• Drink warm water and take adequate physical rest', 55, 465);
      ctx.fillText('• Avoid cold beverages and air-conditioner exposure', 55, 495);

      // Doctor signature stamp
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1;
      ctx.strokeRect(520, 710, 180, 50);
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText('Dr. Manisha Agarwal', 535, 732);
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillText('Verified Clinical Signature', 535, 748);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `clinic_prescription_${(patientName || 'arjun').toLowerCase()}.png`, { type: 'image/png' });
        handleFile(file);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 font-semibold block">
            Clinical Document Intake
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Prescription &amp; Clinical OCR Ready</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Document &amp; Prescription Scanner
        </h1>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
          Upload hospital discharge summaries, clinical notes, or outpatient prescription photos. The clinical engine extracts medications, dosages, frequency schedules, and care tasks automatically.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-md text-slate-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AI Vision Model Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold text-slate-800">Active Vision Engine:</span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
              ⚡ Google Gemini 3.5 Lite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="model-select" className="text-[11px] text-slate-600 font-medium">Model Engine:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              localStorage.setItem('carebridge_gemini_model', e.target.value);
            }}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="gemini-3.5-flash-lite">⚡ Gemini 3.5 Flash-Lite (Recommended - Fast &amp; High Precision)</option>
            <option value="gemini-3.5-flash">🚀 Gemini 3.5 Flash (General Multimodal)</option>
            <option value="gemini-2.5-flash">🔬 Gemini 2.5 Flash</option>
            <option value="gemini-1.5-flash">⚡ Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro (Deep Clinical Reasoning)</option>
          </select>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
            isDragging 
              ? 'border-emerald-600 bg-emerald-50/50' 
              : 'border-slate-300 hover:border-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />

          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Upload className="w-5 h-5 text-emerald-700" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Drag and drop discharge PDF or prescription photo
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, PNG, JPG, or JPEG up to 25 MB &bull; High-accuracy doctor handwriting detection
            </p>
          </div>

          <div className="pt-1">
            <span className="tactile-btn px-3.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 shadow-2xs hover:bg-emerald-50/40">
              Select Document File
            </span>
          </div>
        </div>

        {/* Quick Sample Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Need test documentation?</span>
          <button
            type="button"
            onClick={loadSamplePrescription}
            className="tactile-btn text-emerald-700 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Load Sample Prescription Slip</span>
          </button>
        </div>

        {/* Selected File Card */}
        {selectedFile && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">
                <FileCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type || 'Document'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProcessScan}
              disabled={isProcessing}
              className="tactile-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-2xs cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Run OCR &amp; Extract Care Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Live Processing Indicator */}
        {isProcessing && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                <span>{processingStep}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700">Clinical OCR In Progress</span>
            </div>
            <div className="w-full bg-emerald-200/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Image Preview */}
        {previewUrl && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Scanned Medical Document Preview</span>
              </div>
              <span className="text-[10px] text-emerald-800 font-mono">
                Ready for Extraction
              </span>
            </div>
            <img 
              src={previewUrl} 
              alt="Scanned prescription preview" 
              className="max-h-72 rounded border border-slate-300 mx-auto shadow-2xs object-contain bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};
