
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Ticket, 
  Email, 
  ChatMessage, 
  OnHoldTicket, 
  UnplannedOutage, 
  PlannedOutage, 
  IBSSRecord, 
  AltiplanoCheck,
  GeneratedReport
} from '../types';

interface AdminPanelProps {
  tickets: Ticket[];
  emails: Email[];
  onHoldTickets: OnHoldTicket[];
  unplannedOutages: UnplannedOutage[];
  plannedOutages: PlannedOutage[];
  ibssRecords: IBSSRecord[];
  altiplanoChecks: AltiplanoCheck[];
  onUploadData: (type: string, data: any[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  tickets, 
  emails, 
  onHoldTickets,
  unplannedOutages,
  plannedOutages,
  ibssRecords,
  altiplanoChecks,
  onUploadData 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      parts: [{ text: "NOC Intelligence Core Online. I am strictly grounded to the current Fibre Networks system state.\n\nI can analyze active tickets, cross-reference diagnostics, or generate performance reports based on your current data." }] 
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const suggestions = [
    "Identify high priority faults",
    "List services in unplanned outages",
    "Summarize Altiplano bad results",
    "Check IBSS status for SID1234..."
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const downloadCSV = (report: GeneratedReport) => {
    const blob = new Blob([report.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSend = customPrompt || userInput;
    if (!textToSend.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // BUILD FULL DATA SNAPSHOT FOR GROUNDING
      const currentContext = {
        timestamp: new Date().toLocaleString(),
        activeTickets: tickets.map(t => ({
          id: t.id,
          sid: t.serviceId,
          customer: t.customerName,
          status: t.status,
          priority: t.priority,
          address: t.address
        })),
        networkDiagnostics: altiplanoChecks.map(a => ({
          sid: a.serviceId,
          power: a.rxPower,
          status: a.status,
          opticalRange: a.opticalRange,
          vlans: `${a.svlan}/${a.cvlan}`
        })),
        provisioningRecords: ibssRecords.map(i => ({
          sid: i.serviceId,
          type: i.requestType,
          status: i.status,
          date: i.rfsDate
        })),
        outages: {
          unplanned: unplannedOutages.map(u => ({ sid: u.serviceId, ref: u.outageRef })),
          planned: plannedOutages.map(p => ({ ref: p.ref, sids: p.serviceIds, start: p.startTime, end: p.endTime }))
        },
        emails: emails.map(m => ({ from: m.from, subject: m.subject, time: m.timestamp })),
        onHold: onHoldTickets
      };

      const systemInstruction = `
        You are the "Fibre Networks NOC Intelligence Agent". 
        YOUR GOAL: Provide technical support and data analysis based ONLY on the provided JSON context.

        GROUNDING RULES:
        1. If a user asks about a specific Service ID (SID), you MUST check:
           - Is it in 'outages'?
           - Is it in 'networkDiagnostics'? What is the power/status?
           - Is it in 'provisioningRecords'? Is it a new connection (potential Failed Intact)?
        2. DO NOT hallucinate info. If data for a specific SID isn't in context, say: "Service ID [ID] is not found in the current system logs."
        3. For 'RedLOS' workflow:
           - Bad Line Test + New Connection = Route to CSC (Failed Intact).
           - Bad Line Test + Existing Connection = Route to Field Force (Fault).
           - Good Line Test = Check customer CPE/Config.

        JSON CONTEXT:
        ${JSON.stringify(currentContext)}

        If generating a report, append this JSON exactly at the end:
        {"report": {"type": "CSV" | "PIR", "title": "string", "content": "string"}}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: messages.concat([newUserMessage]),
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 4000 }
        },
      });

      const responseText = response.text || "Communication timeout.";
      const jsonMatch = responseText.match(/\{[\s\S]*"report"[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const report = parsed.report;
          setReports(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            title: report.title,
            type: report.type,
            data: report.content,
            timestamp: new Date().toLocaleString()
          }, ...prev]);
          setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText.replace(jsonMatch[0], "").trim() }] }]);
        } catch (e) {
          setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "NOC Core Link Error. Verify API credentials." }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "[Voice Link Active] Awaiting vocal command." }] }]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-h-full overflow-hidden animate-in fade-in duration-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onUploadData(activeUploadType || 'generic', []);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Dataset [${activeUploadType?.toUpperCase()}] ingested. Intelligence core updated.` }] }]);
          }
        }} 
      />

      {/* CHAT INTERFACE */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
        <div className="shrink-0 p-6 bg-slate-800/40 border-b border-slate-700/50 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 ${isVoiceActive ? 'bg-red-500 animate-pulse scale-105' : 'bg-indigo-600 shadow-indigo-900/40'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isVoiceActive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                )}
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Intel-Agent Core</h2>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-red-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isVoiceActive ? 'Voice Grounding: Locked' : 'Grounded: Lite Engine'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ role: 'model', parts: [{ text: "Context purged. Ready for new operations." }] }])}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-700/30 transition-all"
          >
            Reset Brain
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[1.8rem] text-sm leading-relaxed border shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                  : 'bg-slate-800/50 text-slate-200 border-slate-700/50 rounded-tl-none backdrop-blur-sm'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-indigo-400">
                  {msg.parts[0].text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800/30 px-6 py-4 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-2">Cross-referencing logs...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="shrink-0 p-8 bg-slate-950/90 border-t border-slate-800 backdrop-blur-2xl">
          <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
            {suggestions.map(s => (
              <button 
                key={s} 
                onClick={() => handleSendMessage(undefined, s)}
                className="whitespace-nowrap bg-slate-800/50 hover:bg-indigo-600/20 text-[10px] font-black text-slate-300 hover:text-indigo-400 px-4 py-2 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all uppercase tracking-widest"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-4">
            <button 
              type="button"
              onClick={toggleVoiceMode}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Query Service IDs, Ticket IDs, or Outages..."
              className="flex-1 bg-slate-900 border border-slate-700 text-white px-6 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={isTyping || !userInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/20 active:scale-95"
            >
              Query
            </button>
          </form>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="lg:w-[380px] flex flex-col gap-6 shrink-0">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Training Vault</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Indexed</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'on-hold', label: 'On-Hold Logs', icon: '📋' },
              { id: 'altiplano', label: 'Altiplano Diagnostics', icon: '📡' },
              { id: 'planned-outages', label: 'Planned Maintenance', icon: '🗓️' },
              { id: 'outages-ibss', label: 'Outages & IBSS', icon: '🚨' }
            ].map(sync => (
              <button 
                key={sync.id}
                onClick={() => { setActiveUploadType(sync.id); fileInputRef.current?.click(); }}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">{sync.icon}</div>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{sync.label}</span>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Grounded Reports</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reports.length} Generated</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {reports.map(report => (
              <div key={report.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-400 transition-all shadow-sm">
                <div className="text-[10px] font-black text-slate-800 uppercase leading-tight mb-1">{report.title}</div>
                <div className="text-[8px] text-slate-400 uppercase font-bold mb-3 flex items-center gap-2">
                  <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{report.type}</span>
                  <span>{report.timestamp}</span>
                </div>
                <button 
                  onClick={() => report.type === 'CSV' ? downloadCSV(report) : setMessages(prev => [...prev, { role: 'model', parts: [{ text: `### DATA PREVIEW: ${report.title}\n\n${report.data}` }] }])}
                  className="w-full bg-white border border-slate-200 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Inspect Content
                </button>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                <div className="text-4xl mb-3 opacity-20">📊</div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center px-6">Ask the agent to generate a CSV or PIR report</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
