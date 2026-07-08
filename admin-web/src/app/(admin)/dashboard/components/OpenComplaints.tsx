/**
 * OpenComplaints Component
 * 
 * Shows complaints status with All Clear state
 */

"use client";

export function OpenComplaints({
  openCount,
  message,
}: {
  openCount: number;
  message: string;
}) {
  const allClear = openCount === 0;

  return (
    <div className="dashboard-card p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">Open Complaints</h2>
        <button className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider">
          Refresh
        </button>
      </div>

      {/* All Clear State */}
      <div className="flex flex-col items-center justify-center py-8">
        {/* Illustration Placeholder */}
        <div className="w-48 h-32 bg-slate-50 rounded-lg mb-6 flex items-center justify-center border border-slate-100">
          <svg className={`w-16 h-16 ${allClear ? "text-slate-300" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            {allClear ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            )}
          </svg>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {allClear ? "All Clear!" : `${openCount} Open Issue${openCount === 1 ? "" : "s"}`}
        </h3>
        <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
          {message}
        </p>

        <button className="px-6 py-2.5 border-2 border-indigo-600 text-indigo-600 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-50 transition-colors">
          Resolution History
        </button>
      </div>

      {/* Floating FAB */}
      <button className="absolute bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-colors">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
