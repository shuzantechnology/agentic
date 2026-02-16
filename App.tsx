
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

  const handleIngestData = (type: string, data: any[]) => {
    // Dynamic update logic for all 4 major workflow data sources
    switch (type) {
      case 'on-hold':
        setOnHoldTickets(data as OnHoldTicket[]);
        break;
      case 'altiplano':
        setAltiplanoChecks(data as AltiplanoCheck[]);
        break;
      case 'planned-outages':
        setPlannedOutages(data as PlannedOutage[]);
        break;
      case 'outages-ibss':
        // If data contains outage info, update unplanned. If it contains IBSS, update IBSS.
        // For simplicity in this demo, we handle them as a composite if provided or separate triggers.
        if (data.length > 0 && 'outageRef' in data[0]) {
          setUnplannedOutages(data as UnplannedOutage[]);
        } else if (data.length > 0 && 'rfsDate' in data[0]) {
          setIbssRecords(data as IBSSRecord[]);
        }
        break;
      case 'outages':
        setUnplannedOutages(data as UnplannedOutage[]);
        break;
      case 'ibss':
        setIbssRecords(data as IBSSRecord[]);
        break;
    }
    console.log(`System Ingested ${type}:`, data);
  };

  const resetApplication = () => {
    if (window.confirm("Are you sure you want to reset everything?")) {
      setTickets([]);
      setEmails([]);
      setNextTicketId(1700001);
      setOnHoldTickets([]);
      setUnplannedOutages([]);
      setPlannedOutages([]);
      setIbssRecords([]);
      setAltiplanoChecks([]);
      setActiveTab('webform');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden h-screen">
      <header className="bg-slate-900 text-white shadow-lg shrink-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-indigo-900/50">F</div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Fibre Networks</h1>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">NOC Core v2.5</p>
            </div>
          </div>
          
          <nav className="flex bg-slate-800/40 p-1 rounded-xl gap-1 border border-slate-700/50">
            {[
              { id: 'webform', label: 'RSP Form', icon: '📝' },
              { id: 'noc', label: 'Tickets', icon: '🛠️' },
              { id: 'inbox', label: 'Mail', icon: '✉️' },
              { id: 'admin', label: 'Intel Agent', icon: '⚡' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[10px] transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="uppercase tracking-widest">{tab.label}</span>
                {tab.id === 'inbox' && emails.length > 0 && (
                  <span className="bg-indigo-400 text-indigo-950 px-1.5 py-0.5 rounded-full text-[8px] font-black">{emails.length}</span>
                )}
              </button>
            ))}
          </nav>

          <button onClick={resetApplication} className="text-slate-500 hover:text-red-400 transition-colors text-[9px] font-black uppercase tracking-widest">
            System Reset
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto h-full">
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
                onHoldTickets={onHoldTickets}
                unplannedOutages={unplannedOutages}
                plannedOutages={plannedOutages}
                ibssRecords={ibssRecords}
                altiplanoChecks={altiplanoChecks}
                onUploadData={handleIngestData}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-2 px-6 flex justify-between items-center shrink-0">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">&copy; 2025 Fibre Networks</span>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black text-slate-500 uppercase">Core: Nominal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black text-slate-500 uppercase">Agent: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
