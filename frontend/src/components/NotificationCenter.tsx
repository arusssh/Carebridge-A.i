import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BellRing, 
  Wifi, 
  Battery, 
  ShieldCheck, 
  Check, 
  Mail, 
  MessageSquare, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Pill, 
  Building2, 
  Activity, 
  Radio 
} from 'lucide-react';
import { NotificationMessage, CarePlan, DeliveryMode } from '../types';
import { fetchNotifications, sendNotification, replyNotification } from '../api/client';

interface NotificationCenterProps {
  carePlan: CarePlan;
  onTaskCompletedFromSMS?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  carePlan,
  onTaskCompletedFromSMS
}) => {
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('REAL_EMAIL');
  const [recipientName, setRecipientName] = useState<string>(carePlan.patient_name);
  const [phoneNumber, setPhoneNumber] = useState<string>('+1 (555) 234-8901');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gateway Config state
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  
  const [twilioSid, setTwilioSid] = useState<string>('');
  const [twilioToken, setTwilioToken] = useState<string>('');
  const [twilioFrom, setTwilioFrom] = useState<string>('');

  const loadMessages = async () => {
    try {
      const data = await fetchNotifications();
      setMessages(data);
    } catch (err) {
      console.log('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    const channel = deliveryMode === 'REAL_EMAIL' ? 'EMAIL' : 'SMS';

    const smtpConfig = smtpUser && smtpPass ? {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      password: smtpPass,
      from_name: "CareBridge",
      from_email: smtpUser
    } : undefined;

    const twilioConfig = twilioSid && twilioToken ? {
      account_sid: twilioSid,
      auth_token: twilioToken,
      from_number: twilioFrom
    } : undefined;

    try {
      const result = await sendNotification({
        recipient_name: recipientName,
        phone_number: phoneNumber,
        recipient_email: recipientEmail || undefined,
        channel,
        delivery_mode: deliveryMode,
        message_body: customText,
        task_id: carePlan.tasks[0]?.id,
        smtp_config: smtpConfig,
        twilio_config: twilioConfig
      });

      await loadMessages();

      if (result.delivery_report?.success) {
        setStatusMessage({
          type: 'success',
          text: result.delivery_report.message || 'Notification delivered successfully.'
        });
      } else if (result.delivery_report?.error) {
        setStatusMessage({
          type: 'error',
          text: result.delivery_report.error
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Message processed in ${deliveryMode} mode.`
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch notification.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPreset = (text: string) => {
    setCustomText(text);
  };

  const handleSimulatedReply = async (msgId: string) => {
    setReplyingId(msgId);
    try {
      await replyNotification({
        notification_id: msgId,
        reply_text: '1 - Confirmed Taken'
      });
      await loadMessages();
      if (onTaskCompletedFromSMS) {
        onTaskCompletedFromSMS();
      }
    } catch (err: any) {
      alert(`Reply error: ${err.message}`);
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Clinical Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <BellRing className="w-3.5 h-3.5 text-emerald-700" />
          <span>Patient Engagement &amp; Delivery Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Clinical Notification Dispatcher
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Deliver time-sensitive medication reminders and appointment alerts directly via authenticated SMS, verified email, or live interactive device simulator.
        </p>
      </div>

      {/* Delivery Mode Selector Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Gateway Channel</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDeliveryMode('REAL_EMAIL')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold transition cursor-pointer ${
              deliveryMode === 'REAL_EMAIL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Direct Email</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryMode('REAL_SMS')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold transition cursor-pointer ${
              deliveryMode === 'REAL_SMS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Cellular SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryMode('SIMULATED')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold transition cursor-pointer ${
              deliveryMode === 'SIMULATED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Device Simulator</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded text-xs flex items-center gap-2.5 font-medium border bg-emerald-50 border-emerald-200 text-emerald-900">
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-slate-700 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dispatcher Form */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleSend} className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-700" />
                <span>
                  {deliveryMode === 'REAL_EMAIL' && 'Dispatch Authenticated Email'}
                  {deliveryMode === 'REAL_SMS' && 'Dispatch Cellular Text Alert'}
                  {deliveryMode === 'SIMULATED' && 'Dispatch to On-Screen Device'}
                </span>
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                {deliveryMode.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  required
                />
              </div>

              {/* Conditional Email or Phone Input */}
              {deliveryMode === 'REAL_EMAIL' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination Mobile Number (E.164)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 234-8901"
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Instruction / Reminder Body</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                placeholder="CareBridge Reminder: Take Metoprolol 25mg with breakfast. Reply '1' once taken."
                className="w-full p-3 border border-slate-300 rounded text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                required
              />
            </div>

            {/* Quick Trigger Clinical Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Clinical Templates</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(`CareBridge: Good morning ${carePlan.patient_name}. Please take your prescribed morning medication with food.`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                >
                  <Pill className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Morning Medication</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(`CareBridge Alert: Reminder for your clinic visit in 48 hours. Bring all active prescription containers.`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>Clinic Appointment</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(`CareBridge Vitals: Please record your evening blood pressure and check recovery progress.`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Vitals Logging</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 rounded text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching Notification...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Send {deliveryMode === 'REAL_EMAIL' ? 'Email' : deliveryMode === 'REAL_SMS' ? 'SMS' : 'Simulated Message'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Expandable Gateway Credentials Panel */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <span>Live Delivery Gateway Configuration (SMTP &amp; Twilio)</span>
              </div>
              {isConfigOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isConfigOpen && (
              <div className="p-5 border-t border-slate-100 space-y-5 bg-slate-50 text-xs">
                {/* Email (SMTP) Setup */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      Email Gateway Parameters (SMTP)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Port 587 / TLS</span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Provide optional SMTP credentials to dispatch authenticated discharge instructions:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sender Email / User</label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="outreach@carebridge.org"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">SMTP App Password</label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* SMS (Twilio) Setup */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                      Cellular SMS Gateway Parameters (Twilio REST)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">REST API v2010</span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Configure Twilio API credentials to transmit real cellular SMS across telecommunication carriers:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Account SID</label>
                      <input
                        type="text"
                        value={twilioSid}
                        onChange={(e) => setTwilioSid(e.target.value)}
                        placeholder="ACxxxxxxxx..."
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Auth Token</label>
                      <input
                        type="password"
                        value={twilioToken}
                        onChange={(e) => setTwilioToken(e.target.value)}
                        placeholder="Auth token..."
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">From Number</label>
                      <input
                        type="text"
                        value={twilioFrom}
                        onChange={(e) => setTwilioFrom(e.target.value)}
                        placeholder="+15551234567"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Smartphone Device Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[32px] bg-slate-750 p-4 shadow-xl border-4 border-slate-600 relative">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-28 h-4 bg-slate-700 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-2" />
              <div className="w-8 h-1 bg-slate-500 rounded-full" />
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-slate-100 rounded-[20px] overflow-hidden flex flex-col h-[540px]">
              {/* Status Bar */}
              <div className="bg-slate-200/80 px-5 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 tabular-nums">
                <span>09:41</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Message Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  CB
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">CareBridge Dispatch</h3>
                  <p className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    Verified Healthcare Line
                  </p>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                <div className="text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                    Encrypted Care Feed
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-16">
                    No active messages dispatched. Use the form on the left to trigger a notification.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-1.5">
                      {/* Received Alert Bubble */}
                      <div className="max-w-[88%] bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold flex items-center gap-1 text-slate-700">
                            {msg.delivery_mode === 'REAL_EMAIL' && <Mail className="w-3 h-3 text-emerald-700" />}
                            {msg.delivery_mode === 'REAL_SMS' && <MessageSquare className="w-3 h-3 text-slate-700" />}
                            {msg.delivery_mode === 'SIMULATED' && <Smartphone className="w-3 h-3 text-slate-700" />}
                            <span>
                              {msg.delivery_mode === 'REAL_EMAIL' ? 'Email Dispatch' :
                               msg.delivery_mode === 'REAL_SMS' ? 'SMS Cellular' : 'Device Simulation'}
                            </span>
                          </span>
                          <span className="text-slate-400">Just now</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium">
                          {msg.message_body}
                        </p>
                        {msg.recipient_email && (
                          <p className="text-[10px] text-emerald-700 font-mono">
                            To: {msg.recipient_email}
                          </p>
                        )}
                        <div className="pt-1 text-[10px] text-slate-500 font-mono">
                          {msg.action_prompt}
                        </div>
                      </div>

                      {/* Interactive 2-Way Reply Simulation */}
                      {!msg.action_taken ? (
                        <div className="pl-2">
                          <button
                            type="button"
                            onClick={() => handleSimulatedReply(msg.id)}
                            disabled={replyingId === msg.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Reply: "1 - Confirmed Taken"</span>
                          </button>
                        </div>
                      ) : (
                        /* Sent Reply Bubble */
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-emerald-700 text-white rounded-lg p-2.5 text-xs shadow-xs space-y-0.5">
                            <p className="font-medium text-[11px]">1 - Confirmed Taken</p>
                            <span className="text-[9px] text-emerald-200 flex items-center justify-end gap-1">
                              Delivered <CheckCircle2 className="w-2.5 h-2.5 inline text-emerald-300" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Phone Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Text Message..."
                  disabled
                  className="flex-1 px-3 py-1.5 bg-slate-100 rounded text-xs text-slate-500 outline-hidden"
                />
                <button disabled className="p-2 rounded bg-emerald-600 text-white opacity-50">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
