import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Hospital, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  FileCheck 
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState<string>('');
  const [mrn, setMrn] = useState<string>('');
  const [role, setRole] = useState<'Patient' | 'Primary Caregiver' | 'Clinician'>('Patient');
  const [facility, setFacility] = useState<string>('City Health System');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full legal name to proceed.');
      return;
    }
    const cleanMrn = mrn.trim() || `MRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const authUser: AuthUser = {
      name: name.trim(),
      mrn: cleanMrn,
      role: role,
      facility: facility.trim() || 'Regional Medical Center',
      loginTime: new Date().toISOString()
    };

    onLogin(authUser);
  };

  const handleQuickLogin = (demoName: string, demoRole: 'Patient' | 'Primary Caregiver' | 'Clinician', demoMrn: string) => {
    setName(demoName);
    setRole(demoRole);
    setMrn(demoMrn);
    const authUser: AuthUser = {
      name: demoName,
      mrn: demoMrn,
      role: demoRole,
      facility: 'City Health System',
      loginTime: new Date().toISOString()
    };
    onLogin(authUser);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white shadow-xs mb-4">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          CareBridge Clinical Access
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Secure Medical Document Intake &amp; Discharge Coordination
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-emerald-100 rounded-xl sm:px-8">
          {error && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullname" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullname"
                  type="text"
                  required
                  placeholder="e.g. Arjun"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mrn" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Medical Record Number (MRN) / Access ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <input
                  id="mrn"
                  type="text"
                  placeholder="e.g. MRN-94021 (or leave blank to auto-assign)"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Clinical Access Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Patient', 'Primary Caregiver', 'Clinician'] as const).map((r) => {
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition text-center cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-900'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="facility" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Hospital / Health System
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hospital className="w-4 h-4" />
                </div>
                <input
                  id="facility"
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
            >
              <span>Access Clinical Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Demonstration Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Arjun', 'Patient', 'MRN-48201')}
                className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md transition text-center cursor-pointer"
              >
                Sign in as Arjun (Patient)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Dr. Rajesh Patel', 'Clinician', 'NPI-19284')}
                className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md transition text-center cursor-pointer"
              >
                Sign in as Dr. Patel (Clinician)
              </button>
            </div>
          </div>
        </div>

        {/* Security & Confidentiality Safeguards */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>HIPAA Safeguards &amp; Zero-Hallucination Audit Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
