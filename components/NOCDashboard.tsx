
import React from 'react';
import { Ticket } from '../types';

interface NOCDashboardProps {
  tickets: Ticket[];
  onStatusUpdate: (id: number, status: Ticket['status']) => void;
}

export const NOCDashboard: React.FC<NOCDashboardProps> = ({ tickets, onStatusUpdate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">NOC Active Tickets</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
            Total: {tickets.length}
          </span>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          No active tickets found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Service ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{ticket.id}</td>
                  <td className="px-6 py-4 font-mono text-xs">{ticket.serviceId}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{ticket.customerName}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{ticket.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                      ticket.status === 'CSC Assigned' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${ticket.priority.includes('Critical') ? 'text-red-600' : 'text-slate-600'}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{ticket.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
