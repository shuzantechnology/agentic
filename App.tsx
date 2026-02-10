
import React, { useState, useEffect } from 'react';
import { Webform } from './components/Webform';
import { NOCDashboard } from './components/NOCDashboard';
import { Inbox } from './components/Inbox';
import { Ticket, Email } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'webform' | 'noc' | 'inbox'>('webform');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [nextTicketId, setNextTicketId] = useState(1700001);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-900/50">F</div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Fibre Networks</h1>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">NOC Redlos Automation Agent</p>
            </div>
          </div>
          <nav className="flex bg-slate-800/50 p-1.5 rounded-2xl gap-2 border border-slate-700">
            {[
              { id: 'webform', label: 'RSP Form', icon: '📝' },
              { id: 'noc', label: 'NOC View', icon: '🛠️' },
              { id: 'inbox', label: 'Inboxes', icon: '✉️' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'inbox' && emails.length > 0 && (
                  <span className="ml-1 bg-indigo-400 text-indigo-900 text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-indigo-500 font-black">{emails.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-10">
        <div className="transition-all duration-300">
          {activeTab === 'webform' && (
            <Webform 
              nextTicketId={nextTicketId} 
              onTicketCreated={handleNewTicket}
              onSendEmail={addEmail}
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
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 px-8 text-center">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span>&copy; 2025 Fibre Networks Limited &bull; Regional NOC Operations</span>
          <div className="flex gap-6">
            <span className="text-emerald-500 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Network Status: Nominal</span>
            <span>Security Level: Tier 1</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
