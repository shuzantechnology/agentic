
import React, { useState } from 'react';
import { Email, Ticket, SignOff } from '../types';
import { ALTIPLANO_CHECKS } from '../mockData';

interface InboxProps {
  emails: Email[];
  tickets: Ticket[];
  onSendEmail: (email: Omit<Email, 'id' | 'timestamp'>) => void;
  onStatusUpdate: (id: number, status: Ticket['status']) => void;
}

export const Inbox: React.FC<InboxProps> = ({ emails, tickets, onSendEmail, onStatusUpdate }) => {
  const [selectedAccount, setSelectedAccount] = useState<'noc' | 'csc' | 'field' | 'rsp'>('noc');
  const [viewEmail, setViewEmail] = useState<Email | null>(null);

  const filteredEmails = emails.filter(e => {
    if (selectedAccount === 'noc') return e.to === 'noc@test.com' || e.from === 'noc@test.com';
    if (selectedAccount === 'csc') return e.to === 'csc@fibrenetworks.co.nz' || e.to === 'csc@test.com';
    if (selectedAccount === 'field') return e.to === 'field_force@test.com' || e.from === 'field_force@test.com';
    if (selectedAccount === 'rsp') return !['noc@test.com', 'csc@fibrenetworks.co.nz', 'csc@test.com', 'field_force@test.com'].includes(e.to);
    return false;
  });

  const simulateFieldSignOff = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    onSendEmail({
      from: 'field_force@test.com',
      to: 'noc@test.com',
      subject: `TT-${ticketId}`,
      body: `Date and Time Service Restored: ${new Date().toLocaleString()}\nTrouble Found: Come on site found mice chewed the cable underfloor. Cable was laying down and wrong code of cable was run underfloor. \nCause What/Who: Poor workmanship \nAction Taken: So run new cable underfloor and clipped Splice at both ends Service given Checked reading`
    });

    alert("Field force has submitted sign-off for Ticket #" + ticketId);
  };

  const handleAgentAcceptance = (email: Email) => {
    const ticketIdMatch = email.subject.match(/TT-(\d+)/);
    if (!ticketIdMatch) return;
    const ticketId = parseInt(ticketIdMatch[1]);
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) return;

    // Simulation of post-fix linetest
    const troubleFound = email.body.match(/Trouble Found: (.*)/)?.[1] || "N/A";
    const cause = email.body.match(/Cause What\/Who: (.*)/)?.[1] || "N/A";
    const actionTaken = email.body.match(/Action Taken: (.*)/)?.[1] || "N/A";

    // 1. Reply to Field Force
    onSendEmail({
      from: 'noc@test.com',
      to: 'field_force@test.com',
      subject: `Re: TT-${ticketId}`,
      body: `Sign-off for the TT--${ticketId} has been accepted.`
    });

    // 2. Reply to RSP (RSP Partner Notification)
    onSendEmail({
      from: 'noc@test.com',
      to: ticket.requesterEmail,
      subject: `RESOLVED: Ticket ID ${ticketId} - ${ticket.serviceId}`,
      body: `The issue has been resolved. Please test with your customer.
 
Signoff as follows:

Issue Found: ${troubleFound}
Fault Cause Description: ${cause}
Action Taken: ${actionTaken}
 
If you would like further information, please respond to this email, or contact us on 0800 123 456 option 9.

Kind regards,
Fibre Networks NOC`
    });

    onStatusUpdate(ticketId, 'Resolved');
    setViewEmail(null);
    alert(`Automation Successful: Linetest verified. Sign-off accepted for TT-${ticketId}. RSP notified.`);
  };

  return (
    <div className="flex h-[80vh] bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      {/* Mailbox Navigation */}
      <div className="w-72 bg-white border-r border-slate-200 p-6 space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">My Accounts</h3>
        <nav className="space-y-1">
          {[
            { id: 'noc', label: 'Fibre Networks NOC', email: 'noc@test.com' },
            { id: 'csc', label: 'Fibre Networks CSC', email: 'csc@fibrenetworks.co.nz' },
            { id: 'field', label: 'Field Force', email: 'field_force@test.com' },
            { id: 'rsp', label: 'RSP Partners', email: 'Partners Inbox' }
          ].map(acc => (
            <button
              key={acc.id}
              onClick={() => { setSelectedAccount(acc.id as any); setViewEmail(null); }}
              className={`w-full text-left p-3 rounded-xl transition-all ${selectedAccount === acc.id ? 'bg-indigo-600 text-white shadow-lg scale-105 z-10' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <div className="font-bold text-sm">{acc.label}</div>
              <div className={`text-[10px] truncate ${selectedAccount === acc.id ? 'text-indigo-200' : 'text-slate-400'}`}>{acc.email}</div>
            </button>
          ))}
        </nav>

        <div className="mt-10">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Simulate Field</h3>
          <div className="space-y-2">
            {tickets.filter(t => t.status === 'Field WO Created').map(t => (
              <button
                key={t.id}
                onClick={() => simulateFieldSignOff(t.id)}
                className="w-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] p-3 rounded-lg hover:bg-amber-100 font-bold text-center transition-colors"
              >
                Restore & Sign-off TT-{t.id}
              </button>
            ))}
            {tickets.filter(t => t.status === 'Field WO Created').length === 0 && (
              <p className="text-[10px] text-slate-400 italic px-2">No pending WOs</p>
            )}
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-800">Inbox</h2>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full">{filteredEmails.length} Messages</span>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredEmails.map(email => (
            <div 
              key={email.id} 
              onClick={() => setViewEmail(email)}
              className={`p-6 cursor-pointer transition-all ${viewEmail?.id === email.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-900 text-sm truncate pr-2">{email.from}</span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{email.timestamp}</span>
              </div>
              <div className={`text-slate-800 text-xs truncate font-semibold ${viewEmail?.id === email.id ? 'text-indigo-900' : ''}`}>{email.subject}</div>
              <div className="text-slate-500 text-xs truncate mt-1 leading-relaxed">{email.body.substring(0, 120)}...</div>
            </div>
          ))}
          {filteredEmails.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
              <div className="text-6xl">✉️</div>
              <p className="font-medium">No messages in this folder</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="w-[500px] border-l border-slate-200 bg-white flex flex-col shadow-inner">
        {viewEmail ? (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-2xl font-black text-slate-800 mb-6 leading-tight">{viewEmail.subject}</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-400 w-12 text-right">FROM</span> 
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">{viewEmail.from}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-400 w-12 text-right">TO</span> 
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">{viewEmail.to}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed shadow-sm">
                {viewEmail.body}
              </div>
            </div>

            {/* Agent Control Panel */}
            {selectedAccount === 'noc' && viewEmail.from === 'field_force@test.com' && (
              <div className="p-8 border-t border-slate-100 bg-indigo-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">AI</div>
                  <div>
                    <div className="text-xs font-black text-indigo-700 uppercase tracking-widest">NOC Workflow Bot</div>
                    <p className="text-[10px] text-indigo-500 font-medium">Linetest verification recommended.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAgentAcceptance(viewEmail)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  Verify Linetest & Resolve Ticket
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 px-12 text-center">
            <div className="text-6xl mb-4">🔦</div>
            <p className="font-semibold text-lg">Select a message to view details</p>
            <p className="text-sm mt-2">All network communications are logged for quality assurance.</p>
          </div>
        )}
      </div>
    </div>
  );
};
