/**
 * ManagerRegistry Component
 * 
 * Table showing all managers with status badges
 */

"use client";

interface Manager {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  loginId: string;
  status: "active" | "on_leave" | "inactive";
  avatar?: string;
}

interface ManagerRegistryProps {
  managers: Manager[];
  loading: boolean;
}

const statusConfig = {
  active: { bg: "bg-green-50", text: "text-green-600", label: "Active" },
  on_leave: { bg: "bg-orange-50", text: "text-orange-600", label: "On Leave" },
  inactive: { bg: "bg-red-50", text: "text-red-600", label: "Inactive" },
};

const mockManagers: Manager[] = [
  {
    _id: "1",
    name: "Elena Rodriguez",
    email: "elena.r@staysync.com",
    phone: "+1 (555) 234-8890",
    loginId: "MGR-001",
    status: "active",
  },
  {
    _id: "2",
    name: "James Chen",
    email: "james.c@staysync.com",
    phone: "+1 (555) 712-4456",
    loginId: "MGR-042",
    status: "active",
  },
  {
    _id: "3",
    name: "Sarah Miller",
    email: "s.miller@staysync.com",
    phone: "+1 (555) 902-1134",
    loginId: "MGR-088",
    status: "on_leave",
  },
  {
    _id: "4",
    name: "Arjun Kapoor",
    email: "a.kapoor@staysync.com",
    phone: "+1 (555) 776-3321",
    loginId: "MGR-102",
    status: "inactive",
  },
];

export function ManagerRegistry({ managers, loading }: ManagerRegistryProps) {
  const displayManagers = managers.length > 0 ? managers : mockManagers;
  const activeCount = displayManagers.filter((m) => m.status === "active").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">Manager Registry</h2>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {activeCount} Active Managers
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-3">Manager</th>
              <th className="px-6 py-3">Login ID</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  Loading managers...
                </td>
              </tr>
            ) : (
              displayManagers.map((manager) => {
                const statusStyle = statusConfig[manager.status];
                const initials = manager.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={manager._id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    {/* Manager Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                          {manager.avatar ? (
                            <img src={manager.avatar} alt={manager.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{manager.name}</p>
                          <p className="text-xs text-slate-400">{manager.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Login ID */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600">
                        {manager.loginId}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 text-sm text-slate-600">{manager.phone || "-"}</td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
        <p className="text-sm text-slate-500">Showing {displayManagers.length} of {displayManagers.length} managers</p>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-indigo-600 rounded-lg">
            1
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}