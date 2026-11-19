import React, { useState } from 'react';
import { Camera, FileText, ArrowRight } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { IngestionHub } from './components/IngestionHub';
import { DocumentScanner } from './components/DocumentScanner';
import { ValidationReview } from './components/ValidationReview';
import { CarePlanView } from './components/CarePlanView';
import { TimelineView } from './components/TimelineView';
import { TaskTracker } from './components/TaskTracker';
import { NotificationCenter } from './components/NotificationCenter';
import { CaregiverPortal } from './components/CaregiverPortal';
import { BenchmarkDashboard } from './components/BenchmarkDashboard';
import { ClarificationModal } from './components/ClarificationModal';
import { AuthScreen } from './components/AuthScreen';

import { 
  CarePlan, 
  SafetyAuditResult, 
  TimelineBucket, 
  AdherenceStats, 
  ValidationStatus,
  TaskStatus,
  AuthUser 
} from './types';
import { 
  ingestDocument, 
  validateItem, 
  updateTaskStatus, 
  fetchCarePlan,
  IngestResponse
} from './api/client';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('carebridge_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('scanner');
  const [activePersona, setActivePersona] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('carebridge_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        return `${u.name} (${u.role})`;
      }
    } catch {}
    return 'Arjun (Patient)';
  });

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [safetyAudit, setSafetyAudit] = useState<SafetyAuditResult | null>(null);
  const [timeline, setTimeline] = useState<TimelineBucket[]>([]);
  const [adherence, setAdherence] = useState<AdherenceStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState<boolean>(false);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('carebridge_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error('Storage error:', e);
    }
    setActivePersona(`${user.name} (${user.role})`);
    setActiveTab('scanner');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCarePlan(null);
    setSafetyAudit(null);
    setTimeline([]);
    setAdherence(null);
    try {
      localStorage.removeItem('carebridge_auth_user');
    } catch {}
    setActiveTab('scanner');
  };

  const handleIngest = async (rawText: string, patientName: string, presetId?: string) => {
    setIsLoading(true);
    try {
      const response = await ingestDocument({
        raw_text: rawText,
        patient_name: patientName,
        preset_id: presetId
      });
      setCarePlan(response.care_plan);
      setSafetyAudit(response.safety_audit);
      setTimeline(response.timeline);
      setAdherence(response.adherence);
      setActiveTab('validation');
    } catch (err: any) {
      alert(`Ingestion error: ${err.message || 'Failed to process document'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanComplete = (res: IngestResponse) => {
    setCarePlan(res.care_plan);
    setSafetyAudit(res.safety_audit);
    setTimeline(res.timeline);
    setAdherence(res.adherence);
    setActiveTab('validation');
  };

  const handleRefreshCarePlan = async () => {
    if (!carePlan) return;
    try {
      const res = await fetchCarePlan(carePlan.id);
      setCarePlan(res.care_plan);
      setSafetyAudit(res.safety_audit);
      setTimeline(res.timeline);
      setAdherence(res.adherence);
    } catch (err) {
      console.log('Error refreshing care plan:', err);
    }
  };

  const handleValidateItem = async (
    itemType: 'medication' | 'appointment' | 'task',
    itemId: string,
    newStatus: ValidationStatus,
    updatedFields?: Record<string, any>,
    clarificationNote?: string
  ) => {
    if (!carePlan) return;
    try {
      const res = await validateItem(carePlan.id, {
        item_type: itemType,
        item_id: itemId,
        new_status: newStatus,
        updated_fields: updatedFields,
        clarification_note: clarificationNote
      });

      const updatedPlan = { ...carePlan };
      if (itemType === 'medication') {
        updatedPlan.medications = updatedPlan.medications.map(m => 
          m.id === itemId ? { ...m, ...res.updated_item } : m
        );
      } else if (itemType === 'appointment') {
        updatedPlan.appointments = updatedPlan.appointments.map(a => 
          a.id === itemId ? { ...a, ...res.updated_item } : a
        );
      } else if (itemType === 'task') {
        updatedPlan.tasks = updatedPlan.tasks.map(t => 
          t.id === itemId ? { ...t, ...res.updated_item } : t
        );
      }

      setCarePlan(updatedPlan);
      setSafetyAudit(res.safety_audit);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus, notes?: string) => {
    if (!carePlan) return;
    try {
      const res = await updateTaskStatus(carePlan.id, taskId, {
        status: newStatus,
        completion_notes: notes
      });

      const updatedPlan = { ...carePlan };
      updatedPlan.tasks = updatedPlan.tasks.map(t => 
        t.id === taskId ? { ...t, ...res.task } : t
      );
      setCarePlan(updatedPlan);
      setAdherence(res.adherence);
    } catch (err: any) {
      alert(`Task update error: ${err.message}`);
    }
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderEmptyState = (tabTitle: string) => (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
          <Camera className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">No Medical Document Processed Yet</h3>
          <p className="mt-1 text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Welcome, <span className="font-semibold text-emerald-800">{currentUser.name}</span>. To populate the {tabTitle.toLowerCase()}, please upload or scan your discharge report or prescription slip.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Medical Document (OCR)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingest')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-emerald-50/50 border border-slate-300 transition shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Manual Text Intake</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col font-sans text-slate-800">
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        carePlan={carePlan}
        safetyAudit={safetyAudit}
        onOpenQuestions={() => setIsQuestionsOpen(true)}
        activePersona={activePersona}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'scanner' && (
          <DocumentScanner
            onScanComplete={handleScanComplete}
            patientName={carePlan?.patient_name || currentUser.name}
          />
        )}

        {activeTab === 'ingest' && (
          <IngestionHub 
            onIngest={handleIngest} 
            isLoading={isLoading} 
            defaultPatientName={carePlan?.patient_name || currentUser.name}
          />
        )}

        {activeTab === 'validation' && (
          carePlan && safetyAudit ? (
            <ValidationReview
              carePlan={carePlan}
              safetyAudit={safetyAudit}
              onValidateItem={handleValidateItem}
              onProceedToCarePlan={() => setActiveTab('careplan')}
            />
          ) : (
            renderEmptyState('Clinical Validation Review')
          )
        )}

        {activeTab === 'careplan' && (
          carePlan && safetyAudit ? (
            <CarePlanView
              carePlan={carePlan}
              safetyAudit={safetyAudit}
              onOpenQuestions={() => setIsQuestionsOpen(true)}
            />
          ) : (
            renderEmptyState('Care Plan Overview')
          )
        )}

        {activeTab === 'timeline' && (
          carePlan ? (
            <TimelineView
              carePlan={carePlan}
              timeline={timeline}
            />
          ) : (
            renderEmptyState('Recovery Timeline')
          )
        )}

        {activeTab === 'tasks' && (
          carePlan && adherence ? (
            <TaskTracker
              carePlan={carePlan}
              adherence={adherence}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          ) : (
            renderEmptyState('Daily Checklist')
          )
        )}

        {activeTab === 'notifications' && (
          carePlan ? (
            <NotificationCenter
              carePlan={carePlan}
              onTaskCompletedFromSMS={handleRefreshCarePlan}
            />
          ) : (
            renderEmptyState('Alerts & Notifications')
          )
        )}

        {activeTab === 'caregivers' && (
          carePlan ? (
            <CaregiverPortal
              carePlan={carePlan}
              activePersona={activePersona}
              setActivePersona={setActivePersona}
              onRefreshCarePlan={handleRefreshCarePlan}
            />
          ) : (
            renderEmptyState('Care Circle Portal')
          )
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkDashboard />
        )}
      </main>

      {/* Doctor Clarification Modal */}
      {carePlan && safetyAudit && (
        <ClarificationModal
          isOpen={isQuestionsOpen}
          onClose={() => setIsQuestionsOpen(false)}
          carePlan={carePlan}
          safetyAudit={safetyAudit}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Clinical Pipeline Online
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-600 font-medium text-[11px]">HIPAA &amp; SOC-2 Alignment Safeguards Active</span>
          </div>
          <p className="font-semibold text-slate-800">CareBridge AI &bull; Clinical Discharge Validation &amp; Patient Engagement Platform</p>
          <p className="text-[11px] text-slate-500">FastAPI Clinical Engine &bull; Vision Multimodal OCR &bull; SMS Gateway &bull; Multi-User Family Sync</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
