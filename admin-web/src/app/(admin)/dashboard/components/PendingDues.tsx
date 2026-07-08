"use client";

import type { DashboardRole, DueRecord } from "../dashboardData";

export function PendingDues({ dues, role }: { dues: DueRecord[]; role: DashboardRole }) {
  const title = role === "tenant" ? "My Pending Dues" : "Pending Dues";

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button className="text-sm font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700">
          {role === "tenant" ? "Pay Now" : "View All"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Tenant</th>
              <th className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Unit</th>
              <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Amount</th>
            </tr>
          </thead>
          <tbody>
            {dues.map((due) => (
              <tr key={due.id} className="border-b border-slate-50 last:border-0">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${due.tenant.avatarColor}`}>
                      {due.tenant.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{due.tenant.name}</p>
                      <p className="text-xs text-slate-400">{due.tenant.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <p className="text-sm font-semibold text-slate-800">{due.unit}</p>
                  <p className="text-xs text-slate-400">{due.bed}</p>
                </td>
                <td className="py-4 text-right">
                  <span className="text-sm font-bold text-red-500">{due.amount}</span>
                </td>
              </tr>
            ))}
            {dues.length === 0 && (
              <tr>
                <td className="py-6 text-sm text-slate-500" colSpan={3}>
                  No pending dues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
