
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Ticket, Email, ChatMessage } from '../types';

interface AdminPanelProps {
  tickets: Ticket[];
  emails: Email[];
  onUploadData: (type: string, data: any[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tickets, emails, onUploadData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      parts: [{ text: "System Initialized. I am your NOC Intelligence Agent. I am ready to analyze network logs, CSV datasets, or current operational performance. How can I assist you today?" }] 
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSend = customPrompt || userInput;
    if (!textToSend.trim()) return;

    if (!customPrompt) {
      setMessages(prev => [...prev, { role: 'user', parts: [{ text: textToSend }] }]);
      setUserInput('');
    }
    
    setIsTyping(true);

    try {
      // Create a fresh instance for every call to ensure the latest API key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const systemContext = `
        You are the "Fibre Networks NOC Intelligence Agent". 
        Your purpose is to provide deep analysis and administrative support for the Fibre Networks NOC system.
        
        Current System Snapshot:
        - Active Tickets: ${tickets.length}
        - Incoming Emails: ${emails.length}
        - Resolved Ratio: ${tickets.length > 0 ? (tickets.filter(t => t.status === 'Resolved').length / tickets.length * 100).toFixed(1) : 0}%
        
        Your Mission:
        1. Analyze any CSV data provided by the user.
        2. Identify bottlenecks in the "RedLOS" workflow (e.g., slow field force response).
        3. Provide technical summaries of network health.
        
        Response Style: Professional, concise, technical, and formatted with Markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: messages.concat([{ role: 'user', parts: [{ text: textToSend }] }]),
        config: {
          systemInstruction: systemContext,
          temperature: 0.7,
        },
      });

      if (response.text) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          parts: [{ text: response.text }] 
        }]);
      }
    } catch (error) {
      console.error("Agent Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "ERROR: Failed to establish a secure link with the Intelligence Core. Please check if the Gemini API is accessible." }] 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileClick = (type: string) => {
    setActiveUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType) return;

    setIsUploading(activeUploadType);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      const fileSummaryPrompt = `I have successfully uploaded the ${activeUploadType} data file (${file.name}). 
      Here is a data sample for ingestion:
      
      ${content.substring(0, 1500)}
      
      Please analyze this data structure, summarize the key records found, and confirm if this training data improves our fault detection logic.`;
      
      setMessages(prev => [...prev, { 
        role: 'user', 
        parts: [{ text: `Ingesting dataset: ${file.name} for ${activeUploadType} category.` }] 
      }]);
      
      await handleSendMessage(undefined, fileSummaryPrompt);
      
      // Notify the parent system that data was updated
      onUploadData(activeUploadType, [content]); 
      
      setIsUploading(null);
      setActiveUploadType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[700px] w-full animate-in fade-in duration-700">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".csv,.txt,.json"
        onChange={handleFileUpload}
      />

      {/* LEFT: INTELLIGENCE CHAT COMMAND CENTER */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-800 overflow-hidden min-h-[600px]">
        <div className="px-8 py-6 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30 group-hover:border-indigo-500/60 transition-all">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950 animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-widest text-base">NOC Intel Agent</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">AI Ops Architecture</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Secure Link: Active</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
              Gemini 3 Pro-Preview
            </div>
            <button 
              onClick={() => setMessages([{ role: 'model', parts: [{ text: "Session Reset. How can I help you analyze the NOC system now?" }] }])}
              className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              Clear Session
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-900/50 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] px-7 py-5 rounded-[1.8rem] shadow-xl text-sm transition-all leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-medium">
                  {msg.parts[0].text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-800 border border-slate-700 px-6 py-4 rounded-[1.5rem] rounded-tl-none flex gap-2 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT BOX AREA */}
        <div className="p-8 bg-slate-950/80 border-t border-slate-800 backdrop-blur-xl">
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-4">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Query the Intel Agent (e.g., 'Analyze last 10 tickets for patterns')"
              className="flex-1 bg-slate-800 border border-slate-700 text-white px-7 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600 font-semibold shadow-inner"
            />
            <button 
              type="submit"
              disabled={isTyping || !userInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center min-w-[120px]"
            >
              {isTyping ? 'Computing...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: DATA TRAINING VAULT & HUB */}
      <div className="w-full lg:w-[400px] space-y-6">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-8 bg-slate-50 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Training Data Ingestion</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Upload CSV Logs for Agent Learning</p>
          </div>
          
          <div className="p-8 space-y-4">
            {[
              { id: 'on-hold', label: 'On-Hold Tickets', icon: '📋', desc: 'Active fault queue' },
              { id: 'planned', label: 'Planned Outages', icon: '📅', desc: 'Maintenance schedule' },
              { id: 'unplanned', label: 'Unplanned Outages', icon: '🚨', desc: 'Live network alerts' },
              { id: 'altiplano', label: 'Altiplano Diagnostics', icon: '🔬', desc: 'Optical line health' },
              { id: 'ibss', label: 'IBSS Provisioning', icon: '🛠️', desc: 'RFS & Service records' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleFileClick(item.id)}
                disabled={isUploading !== null}
                className={`w-full group relative p-5 rounded-2xl border transition-all flex items-center justify-between text-left ${
                  isUploading === item.id 
                    ? 'bg-indigo-50 border-indigo-400 shadow-inner' 
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.label}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                      {isUploading === item.id ? 'Processing...' : item.desc}
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                  {isUploading === item.id ? (
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model Sync Status</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase">Synchronized</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* PERFORMANCE CARD */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] shadow-2xl p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Agent Intelligence Level</h4>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-indigo-200">Tier 4</span>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-400 tracking-tighter">98.2</span>
              <span className="text-indigo-300 text-sm font-black mb-2">% ACCURACY</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full w-[98.2%] animate-pulse"></div>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-100 font-medium italic opacity-80">
              "The automation agent is correctly routing 98% of RedLOS tickets based on latest regional CSV training data from the Christchurch network center."
            </p>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
        </div>
      </div>
    </div>
  );
};
