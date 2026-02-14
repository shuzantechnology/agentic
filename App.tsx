
import React, { useState } from 'react';
import { Webform } from './components/Webform';
import { NOCDashboard } from './components/NOCDashboard';
import { Inbox } from './components/Inbox';
import { AdminPanel } from './components/AdminPanel';
import { 
  Ticket, 
  Email, 
  OnHoldTicket, 
  UnplannedOutage, 
  PlannedOutage, 
  IBSSRecord, 
  AltiplanoCheck 
} from './types';
import { 
  ON_HOLD_TICKETS as initialOnHold,
  UNPLANNED_OUTAGES as initialUnplanned,
  PLANNED_OUTAGES as initialPlanned,
  IBSS_RECORDS as initialIBSS,
  ALTIPLANO_CHECKS as initialAltiplano
} from './mockData';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'webform' | 'noc' | 'inbox' | 'admin'>('webform');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [nextTicketId, setNextTicketId] = useState(1700001);

  // Simulated Database States
  const [onHoldTickets, setOnHoldTickets] = useState<OnHoldTicket[]>(initialOnHold);
  const [unplannedOutages, setUnplannedOutages] = useState<UnplannedOutage[]>(initialUnplanned);
  const [plannedOutages, setPlannedOutages] = useState<PlannedOutage[]>(initialPlanned);
  const [ibssRecords, setIbssRecords] = useState<IBSSRecord[]>(initialIBSS);
  const [altiplanoChecks, setAltiplanoChecks] = useState<AltiplanoCheck[]>(initialAltiplano);

  const addEmail = (email: Omit<Email, 'id' | 'timestamp'>) => {
    const newEmail: Email = {
      ...email,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setEmails(prev => [newEmail, ...prev]);
  };

  const handleNewTicket = (ticket: Ticket) => {
    setTickets(prev => [...prev, ticket]);
    setNextTicketId(prev => prev + 1);
  };

  const updateTicketStatus = (id: number, status: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleIngestData = (type: string, data: any) => {
    console.log(`System Ingesting ${type}:`, data);
    // Logic for updating simulated datasets based on CSV uploads
    if (type === 'on-hold') {
      // Logic for on-hold updates
    }
  };

  const resetApplication = () => {
    if (window.confirm("Are you sure you want to reset everything? This will clear all tickets, emails, and simulated database records.")) {
      setTickets([]);
      setEmails([]);
      setNextTicketId(1700001);
      setOnHoldTickets([]);
      setUnplannedOutages([]);
      setPlannedOutages([]);
      setIbssRecords([]);
      setAltiplanoChecks([]);
      setActiveTab('webform');
      alert("System has been fully reset.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-slate-900 text-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center px-8 py-5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-[0_0_30px_rgba(79,70,229,0.3)]">F</div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Fibre Networks</h1>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">NOC Automation Agent v2.5</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <nav className="flex bg-slate-800/40 p-1.5 rounded-2xl gap-2 border border-slate-700/50 backdrop-blur-md">
              {[
                { id: 'webform', label: 'RSP Submission', icon: '📝' },
                { id: 'noc', label: 'NOC Dashboard', icon: '🛠️' },
                { id: 'inbox', label: 'Network Inboxes', icon: '✉️' },
                { id: 'admin', label: 'Intel Admin Hub', icon: '⚡' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-xs transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="uppercase tracking-widest">{tab.label}</span>
                  {tab.id === 'inbox' && emails.length > 0 && (
                    <span className="ml-1 bg-indigo-400 text-indigo-950 text-[9px] px-2 py-0.5 rounded-full font-black ring-2 ring-indigo-500/50">{emails.length}</span>
                  )}
                  {tab.id === 'admin' && (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-1 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  )}
                </button>
              ))}
            </nav>

            <button 
              onClick={resetApplication}
              className="text-slate-500 hover:text-red-400 transition-all duration-300 p-2 rounded-xl border border-transparent hover:border-red-900/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group"
              title="Full System Reset"
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-10 flex flex-col">
        <div className="flex-1 transition-all duration-500 ease-in-out">
          {activeTab === 'webform' && (
            <Webform 
              nextTicketId={nextTicketId} 
              onTicketCreated={handleNewTicket}
              onSendEmail={addEmail}
              onHoldTickets={onHoldTickets}
              unplannedOutages={unplannedOutages}
              plannedOutages={plannedOutages}
              ibssRecords={ibssRecords}
              altiplanoChecks={altiplanoChecks}
              tickets={tickets}
            />
          )}
          {activeTab === 'noc' && (
            <NOCDashboard 
              tickets={tickets} 
              onStatusUpdate={updateTicketStatus}
            />
          )}
          {activeTab === 'inbox' && (
            <Inbox 
              emails={emails} 
              onSendEmail={addEmail}
              onStatusUpdate={updateTicketStatus}
              tickets={tickets}
            />
          )}
          {activeTab === 'admin' && (
            <AdminPanel 
              tickets={tickets}
              emails={emails}
              onUploadData={handleIngestData}
            />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-8 text-center mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em]">
          <span>&copy; 2025 Fibre Networks Limited &bull; Intelligence & Workflow Automation</span>
          <div className="flex gap-10">
            <span className="text-emerald-500 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span> 
              Core Network: Nominal
            </span>
            <span className="text-indigo-500 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]"></span> 
              NOC Agent: Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
