/**
 * OccupancyStatus Component
 * 
 * Detailed breakdown with warning banner and room type progress bars
 */

"use client";

import type { DashboardRole, OccupancyRoomType } from "../dashboardData";

export function OccupancyStatus({
  roomTypes,
  role,
}: {
  roomTypes: OccupancyRoomType[];
  role: DashboardRole;
}) {
  const title = role === "tenant" ? "My Room Status" : "Detailed Occupancy Status";
  const subtitle = role === "tenant" ? "Current allocation and stay status" : "Detailed breakdown of facility availability";
  return (
    <div className="dashboard-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-500 font-medium">OCCUPIED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-slate-500 font-medium">FREE</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-4">{subtitle}</p>

      {/* Action Buttons */}
      {role !== "tenant" && <div className="flex gap-3 mb-4">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Advanced Filters
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
      </div>}

      {/* Warning Banner */}
      {role !== "tenant" && <div className="flex items-center gap-3 p-3 mb-6 bg-red-50 border border-red-100 rounded-lg">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-red-600 flex-1">
          Visual chart engine offline. Using cached metrics.
        </p>
        <button className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider">
          Retry Sync
        </button>
      </div>}

      {/* Room Type Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {roomTypes.map((room) => (
          <div key={room.name}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {room.name}
            </p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-indigo-600">
                {room.occupied}/{room.total}
              </span>
              <span className="text-sm font-bold text-slate-400">{room.percentage}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${room.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
