
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TicketRequest, 
  ConnectionType, 
  Priority, 
  Ticket, 
  Email,
  OnHoldTicket,
  UnplannedOutage,
  PlannedOutage,
  IBSSRecord,
  AltiplanoCheck
} from '../types';

interface WebformProps {
  nextTicketId: number;
  onTicketCreated: (ticket: Ticket) => void;
  onSendEmail: (email: Omit<Email, 'id' | 'timestamp'>) => void;
  onHoldTickets: OnHoldTicket[];
  unplannedOutages: UnplannedOutage[];
  plannedOutages: PlannedOutage[];
  ibssRecords: IBSSRecord[];
  altiplanoChecks: AltiplanoCheck[];
  tickets: Ticket[];
}

export const Webform: React.FC<WebformProps> = ({ 
  nextTicketId, 
  onTicketCreated, 
  onSendEmail,
  onHoldTickets,
  unplannedOutages,
  plannedOutages,
  ibssRecords,
  altiplanoChecks,
  tickets
}) => {
  const [formData, setFormData] = useState<TicketRequest>({
    serviceId: '',
    requesterEmail: '',
    customerName: '',
    address: '',
    mobileNumber: '',
    issueReported: '',
    connectionType: ConnectionType.Residential,
    priority: Priority.Normal
  });

  const [toast, setToast] = useState<{ 
    message: string; 
    type: 'info' | 'warning' | 'error' | 'success'; 
    canCopy?: string;
    sticky?: boolean;
  } | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTicketId, setLastTicketId] = useState<number | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isProcessingChecks, setIsProcessingChecks] = useState(false);

  const runWorkflowChecks = useCallback((sid: string) => {
    setIsProcessingChecks(true);
    setCanSubmit(false); // Reset submission capability at start of check
    
    // 1. Check existing on-hold tickets (from mock data / CSV)
    const existingOnHold = onHoldTickets.find(t => t.serviceId === sid);
    if (existingOnHold) {
      setToast({
        message: `There is already an active ticket logged (ID# ${existingOnHold.ticketNumber}) for this service ID. Please follow up on the existing request rather than opening a new one.`,
        type: 'warning',
        canCopy: existingOnHold.ticketNumber,
        sticky: true
      });
      setIsProcessingChecks(false);
      return;
    }

    // 2. Check current session tickets (prevent double submission in real-time)
    const sessionTicket = tickets.find(t => t.serviceId === sid && t.status !== 'Resolved');
    if (sessionTicket) {
      setToast({
        message: `A ticket is already open for this service ID (Ticket ID: ${sessionTicket.id}). Kindly refer to the existing ticket for updates.`,
        type: 'warning',
        canCopy: sessionTicket.id.toString(),
        sticky: true
      });
      setIsProcessingChecks(false);
      return;
    }

    // 3. Check Unplanned Outages
    const unplanned = unplannedOutages.find(o => o.serviceId === sid);
    if (unplanned) {
      setToast({
        message: `This service is part of the ongoing network outage (${unplanned.outageRef}). Please check the outage notification received for this service ID.`,
        type: 'error',
        sticky: true
      });
      setIsProcessingChecks(false);
      return;
    }

    // 4. Check Planned Outages
    const planned = plannedOutages.find(p => p.serviceIds.includes(sid));
    if (planned) {
      const now = new Date();
      const start = new Date(planned.startTime);
      const end = new Date(planned.endTime);
      if (now >= start && now <= end) {
        setToast({
          message: `This service ID is part of a planned maintenance window (between ${planned.startTime} and ${planned.endTime}). Please refer to the maintenance notice.`,
          type: 'info',
          sticky: true
        });
        setIsProcessingChecks(false);
        return;
      }
    }

    // 5. Check Termination Status
    const ibss = ibssRecords.find(i => i.serviceId === sid);
    if (ibss && ibss.requestType === 'Terminate' && (ibss.status === 'Closed' || ibss.status === 'Approved')) {
      setToast({
        message: "This is a terminated service. Please enter an active service ID to continue.",
        type: 'error',
        sticky: true
      });
      setIsProcessingChecks(false);
      return;
    }

    // 6. Altiplano Real-time Check
    const lineTest = altiplanoChecks.find(a => a.serviceId === sid);
    if (lineTest) {
      if (lineTest.status === 'good') {
        setToast({
          message: `Line test indicates the service is active from Fibre Networks' side. (SVID: ${lineTest.svlan}, CVID: ${lineTest.cvlan}). Please verify customer configuration and Port ${lineTest.port} connectivity.`,
          type: 'success',
          sticky: true
        });
        setCanSubmit(true);
      } else {
        setToast({
          message: "Potential Layer-1 or Layer-2 fault detected. Real-time diagnostics confirm service interruption. Please proceed with the submission.",
          type: 'warning',
          sticky: true
        });
        setCanSubmit(true);
      }
    } else {
      setToast({
        message: "Diagnostics unavailable. Manual NOC assessment required. You may proceed to submit the ticket.",
        type: 'warning',
        sticky: true
      });
      setCanSubmit(true);
    }

    setIsProcessingChecks(false);
  }, [onHoldTickets, tickets, unplannedOutages, plannedOutages, ibssRecords, altiplanoChecks]);

  useEffect(() => {
    if (formData.serviceId.length === 14) {
      runWorkflowChecks(formData.serviceId);
    } else {
      setToast(null);
      setCanSubmit(false);
    }
  }, [formData.serviceId, runWorkflowChecks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    const missingFields = Object.entries(formData).filter(([key, val]) => !val);
    if (missingFields.length > 0) {
      const fieldName = missingFields[0][0].replace(/([A-Z])/g, ' $1').toLowerCase();
      alert(`The ${fieldName} field is missing. Please complete all fields before submitting.`);
      return;
    }

    const newTicketId = nextTicketId;
    const newTicket: Ticket = {
      ...formData,
      id: newTicketId,
      status: 'Open',
      createdAt: new Date().toLocaleString()
    };

    const ibss = ibssRecords.find(i => i.serviceId === formData.serviceId);
    const today = new Date().toISOString().split('T')[0];
    
    if (ibss && ibss.requestType === 'New Connection' && ibss.status === 'Closed' && ibss.rfsDate >= today) {
      onSendEmail({
        from: 'noc@test.com',
        to: 'csc@fibrenetworks.co.nz',
        subject: 'FAILED INTACT',
        body: `FAILED INTACT REPORT\n\nService ID: ${formData.serviceId}\nRequester: ${formData.requesterEmail}\nCustomer: ${formData.customerName}\nAddress: ${formData.address}\nMobile: ${formData.mobileNumber}\n\nPlease handle as Failed Intact.`
      });
      newTicket.status = 'CSC Assigned';
    } else {
      onSendEmail({
        from: 'noc@test.com',
        to: 'field_force@test.com',
        subject: `NEW WORK ORDER: TT-${newTicketId}`,
        body: `WORK ORDER DETAILS\n------------------\nCustomer Job ID: ${newTicketId}\nService ID: ${formData.serviceId}\nWork Order Type: FAULTS\nSite Address: ${formData.address}\nPrimary Incident Type: Reactive Maintenance\nIs Business Connection?: ${formData.connectionType === ConnectionType.Business ? 'Yes' : 'No'}\nContact Name: ${formData.customerName}\nPriority: ${formData.priority}\nMobile Phone: ${formData.mobileNumber}\nWork Order Information: ${formData.issueReported}`
      });
      newTicket.status = 'Field WO Created';
      newTicket.woNumber = `WO-${Math.floor(Math.random() * 1000000)}`;
    }

    onTicketCreated(newTicket);
    setLastTicketId(newTicketId);
    setShowSuccessModal(true);
    
    setFormData({
      serviceId: '',
      requesterEmail: '',
      customerName: '',
      address: '',
      mobileNumber: '',
      issueReported: '',
      connectionType: ConnectionType.Residential,
      priority: Priority.Normal
    });
    setToast(null);
  };

  const copyTicketId = () => {
    if (lastTicketId) {
      navigator.clipboard.writeText(lastTicketId.toString());
      alert('Ticket ID copied to clipboard');
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-3xl mx-auto transition-all relative">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-3xl font-extrabold text-slate-800">RSP Fault Submission</h2>
        <p className="text-slate-500 mt-1">Submit customer trouble tickets (CTT) to Fibre Networks NOC.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Service ID (14 digits)</label>
          <div className="relative">
            <input 
              type="text" 
              maxLength={14}
              value={formData.serviceId}
              onChange={(e) => setFormData({...formData, serviceId: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none font-mono text-lg text-slate-900"
              placeholder="SID12345678901"
              disabled={isProcessingChecks}
            />
            {isProcessingChecks && (
              <div className="absolute right-3 top-3 animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Requester Email</label>
          <input 
            type="email" 
            value={formData.requesterEmail}
            onChange={(e) => setFormData({...formData, requesterEmail: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-900"
            placeholder="support@partner.co.nz"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Mobile Number</label>
          <input 
            type="text" 
            value={formData.mobileNumber}
            onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-900"
            placeholder="021 555 1234"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Customer / Business Name</label>
          <input 
            type="text" 
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Installation Address</label>
          <input 
            type="text" 
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Connection Type</label>
          <select 
            value={formData.connectionType}
            onChange={(e) => setFormData({...formData, connectionType: e.target.value as ConnectionType})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none text-slate-900"
          >
            <option value={ConnectionType.Residential}>Residential</option>
            <option value={ConnectionType.Business}>Business</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Priority</label>
          <select 
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none text-slate-900"
          >
            <option value={Priority.Normal}>Normal</option>
            <option value={Priority.Critical}>Critical/ Medical Dependency</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Issue Reported</label>
          <textarea 
            rows={4}
            value={formData.issueReported}
            onChange={(e) => setFormData({...formData, issueReported: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-900"
            placeholder="Loss of signal (Red LOS light on ONT)..."
          ></textarea>
        </div>

        <div className="md:col-span-2 pt-4">
          <button 
            type="submit"
            disabled={!canSubmit || isProcessingChecks}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] ${
              (!canSubmit || isProcessingChecks) 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
            }`}
          >
            {isProcessingChecks ? 'Processing Network Checks...' : 'Submit Trouble Ticket'}
          </button>
        </div>
      </form>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transform animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Request Logged Successfully</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Your request has been logged with a ticket ID <span className="font-bold text-slate-800">{lastTicketId}</span>.
              Please wait as per the standard timelines for the issue to be resolved.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 flex justify-between items-center group">
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</div>
                <div className="text-lg font-mono font-black text-indigo-600">{lastTicketId}</div>
              </div>
              <button 
                onClick={copyTicketId}
                className="bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                </svg>
              </button>
            </div>

            <div className="text-[10px] font-medium text-slate-400 mb-8 px-4">
              If you have any further queries, please contact 0800 123 456 and choose option 9
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg p-5 rounded-2xl shadow-2xl border-2 flex flex-col gap-3 animate-slide-up ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
          toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="mt-1">
                {toast.type === 'error' && '❌'}
                {toast.type === 'warning' && '⚠️'}
                {toast.type === 'success' && '✅'}
                {toast.type === 'info' && 'ℹ️'}
              </div>
              <span className="font-semibold text-sm leading-relaxed">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
          </div>
          {toast.canCopy && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(toast.canCopy!);
                alert('Existing Ticket ID copied to clipboard');
              }}
              className="bg-white/50 hover:bg-white text-[10px] font-bold uppercase tracking-widest text-indigo-700 py-2 rounded-lg border border-indigo-100 transition-colors"
            >
              Copy Reference: {toast.canCopy}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
