"use client";

import type { RentSummary } from "../dashboardData";

export function RentTracking({ rent }: { rent: RentSummary }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-lg shadow-indigo-200">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Rent Tracking</h2>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-100">COLLECTED ({rent.collectedPercent}%)</span>
          <span className="text-lg font-bold">{rent.collected}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${rent.collectedPercent}%` }} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">TARGET</p>
          <p className="text-xl font-bold">{rent.target}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">DUES</p>
          <p className="text-xl font-bold">{rent.dues}</p>
        </div>
      </div>

      <button className="w-full rounded-lg bg-white py-3 text-sm font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:bg-indigo-50">
        {rent.actionLabel}
      </button>
    </div>
  );
}
