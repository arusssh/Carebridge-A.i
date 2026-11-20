import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Heart, 
  Bell, 
  Activity,
  UserCheck,
  Stethoscope,
  User,
  HeartHandshake,
  Check
} from 'lucide-react';
import { CarePlan, CareCircle, CaregiverMember, CaregiverRole } from '../types';
import { fetchCareCircle, addCaregiverMember, logCaregiverActivity } from '../api/client';

interface CaregiverPortalProps {
  carePlan: CarePlan;
  activePersona: string;
  setActivePersona: (persona: string) => void;
  onRefreshCarePlan: () => void;
}

export const CaregiverPortal: React.FC<CaregiverPortalProps> = ({
  carePlan,
  activePersona,
  setActivePersona,
  onRefreshCarePlan
}) => {
  const [circle, setCircle] = useState<CareCircle | null>(null);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Daughter');
  const [role, setRole] = useState<CaregiverRole>('PRIMARY_CAREGIVER');
  const [phone, setPhone] = useState<string>('+1 (555) 000-0000');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadCircle = async () => {
    try {
      const data = await fetchCareCircle(carePlan.id);
      setCircle(data);
    } catch (err) {
      console.log('Error loading care circle:', err);
    }
  };

  useEffect(() => {
    loadCircle();
  }, [carePlan.id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newMember: Partial<CaregiverMember> = {
        name,
        relationship,
        role,
        phone_number: phone,
        receive_sms: true,
        receive_missed_dose_alerts: true,
        can_complete_tasks: true
      };
      const updated = await addCaregiverMember(carePlan.id, newMember);
      setCircle(updated);
      setIsAddOpen(false);
      setName('');
    } catch (err: any) {
      alert(`Error adding member: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingMorningTasks = (carePlan.tasks || []).filter(
    t => t.time_of_day === 'MORNING' && t.status !== 'COMPLETED'
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Clinical Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <Users className="w-3.5 h-3.5 text-emerald-700" />
          <span>Care Circle Collaboration &amp; Synchronization</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Caregiver Circle Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Enable family members, designated proxies, and visiting clinical staff to coordinate care, log medications, and receive automated escalation alerts.
        </p>
      </div>

      {/* Persona Role Switcher Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Clinical Persona</span>
          <h2 className="text-base font-bold text-slate-800 mt-0.5">
            Viewing Session: <span className="text-emerald-700">{activePersona}</span>
          </h2>
          <p className="text-xs text-slate-500">Toggle perspectives to test permissions and notification routing for each member.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePersona(`${carePlan.patient_name} (Patient)`)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold transition cursor-pointer ${
              activePersona.includes('Patient')
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient ({carePlan.patient_name})</span>
          </button>
          <button
            onClick={() => setActivePersona('Sarah Miller (Daughter & Primary Caregiver)')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold transition cursor-pointer ${
              activePersona.includes('Sarah')
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Sarah (Daughter &amp; Proxy)</span>
          </button>
          <button
            onClick={() => setActivePersona('Nurse David Vance, RN (Home Health)')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold transition cursor-pointer ${
              activePersona.includes('Nurse')
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Nurse David (Home RN)</span>
          </button>
        </div>
      </div>

      {/* Missed Care Check-in Alert Banner (Strict 3 Colors) */}
      {pendingMorningTasks.length > 0 && (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800">
              <AlertTriangle className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">Caregiver Notification: Morning Tasks Incomplete</span>
              <span className="text-slate-700">
                {pendingMorningTasks.length} morning task(s) are pending for {carePlan.patient_name}. Escalation reminder routed to primary caregiver Sarah.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded font-mono font-semibold text-[11px] bg-emerald-700 text-white shrink-0 self-start sm:self-auto uppercase tracking-wider">
            Escalation Active
          </span>
        </div>
      )}

      {/* Care Circle Members Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <span>Care Circle Directory ({circle?.members.length || 0})</span>
          </h2>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll Caregiver</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {circle?.members.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{member.name}</h3>
                  <span className="text-xs text-emerald-700 font-medium">{member.relationship}</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {member.role.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-800">{member.phone_number}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{member.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Bell className="w-3 h-3 text-emerald-700" />
                  SMS Alerts Enabled
                </span>
                <span className="text-emerald-700 font-semibold">Authorized to Log</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Shared Activity Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-700" />
          <span>Real-Time Care Coordination Audit Trail</span>
        </h2>
        <p className="text-xs text-slate-500">
          Timestamped record of care events, medication administrations, and provider verifications across authorized team members.
        </p>

        <div className="divide-y divide-slate-100 pt-2">
          {circle?.activity_feed.map((act) => (
            <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{act.actor_name}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{act.actor_role}</span>
                  </div>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{act.description}</p>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
                {act.timestamp.slice(11, 16)} UTC
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Caregiver Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-800/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddMember} className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Enroll New Care Circle Member</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship / Clinical Role</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Spouse / Physical Therapist"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Access Role &amp; Permissions</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as CaregiverRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="PRIMARY_CAREGIVER">Primary Caregiver (Full Management)</option>
                  <option value="FAMILY_OBSERVER">Family Observer (View Only)</option>
                  <option value="HOME_NURSE">Visiting Home Health Nurse</option>
                  <option value="PHYSICIAN">Physician / Specialist</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (E.164 for SMS Alerts)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs cursor-pointer"
              >
                {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
