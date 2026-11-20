import React from 'react';
import { 
  Activity, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  ListTodo, 
  ShieldCheck, 
  HelpCircle, 
  AlertTriangle,
  Camera,
  BellRing,
  Users,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { CarePlan, SafetyAuditResult, AuthUser } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  carePlan: CarePlan | null;
  safetyAudit: SafetyAuditResult | null;
  onOpenQuestions: () => void;
  activePersona: string;
  currentUser: AuthUser | null;
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  carePlan,
  safetyAudit,
  onOpenQuestions,
  currentUser,
  onSignOut
}) => {
  const tabs = [
    { id: 'scanner', label: 'OCR Scanner', icon: Camera },
    { id: 'ingest', label: 'Manual Intake', icon: FileText },
    { 
      id: 'validation', 
      label: 'Clinical Validation', 
      icon: CheckCircle2,
      badge: safetyAudit?.ambiguities_count ? `${safetyAudit.ambiguities_count}` : undefined,
      badgeColor: 'bg-emerald-700 text-white'
    },
    { id: 'careplan', label: 'Care Plan', icon: Activity },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'tasks', label: 'Daily Checklist', icon: ListTodo },
    { id: 'notifications', label: 'Alerts & SMS', icon: BellRing },
    { id: 'caregivers', label: 'Care Circle', icon: Users },
    { id: 'benchmarks', label: 'Safety Benchmarks', icon: ShieldCheck }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand (Strict Medical Emerald & Slate) */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-slate-900">CareBridge</span>
                <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  Clinical AI
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100/90 text-emerald-800 font-semibold border border-emerald-200">
                  ⚡ Gemini 3.5 Lite
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Post-Discharge Validation &amp; Care Coordination
              </p>
            </div>
          </div>

          {/* Active Context & Global Actions */}
          <div className="flex items-center space-x-2.5">
            {currentUser && (
              <div className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-200 text-xs">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  {currentUser.role}
                </span>
                <span className="hidden xl:inline text-slate-400 font-mono text-[11px] tabular-nums">{currentUser.mrn}</span>
              </div>
            )}

            {carePlan && (
              <div className="hidden md:flex items-center space-x-2 px-2.5 py-1.5 bg-emerald-50/40 rounded-md border border-emerald-100 text-xs">
                <span className="text-slate-500 font-normal">Active Report:</span>
                <span className="font-bold text-slate-900">{carePlan.patient_name}</span>
                {safetyAudit && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
                    {safetyAudit.ambiguities_count > 0 ? (
                      <AlertTriangle className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    )}
                    {safetyAudit.safety_score}% Verified
                  </span>
                )}
              </div>
            )}

            {carePlan && (
              <button
                type="button"
                onClick={onOpenQuestions}
                className="tactile-btn inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-emerald-50/50 border border-slate-300 rounded-md transition shadow-2xs cursor-pointer"
                title="Open Doctor Visit Preparation Sheet"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Doctor Sheet</span>
              </button>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={onSignOut}
                className="tactile-btn inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition cursor-pointer"
                title="Sign out of CareBridge session"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation with Tactile Micro-Interactions */}
        <nav className="flex space-x-1 border-t border-slate-100 overflow-x-auto py-1.5 scrollbar-none" aria-label="Navigation Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tactile-btn inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full tabular-nums ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
