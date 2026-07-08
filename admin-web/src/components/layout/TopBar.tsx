/**
 * TopBar Component
 * 
 * Property scope, notifications, help, user profile.
 * Search input and Add Property button moved to Sidebar.
 */

"use client";

interface TopBarProps {
  userName: string;
  profileLabel: string;
  propertyScope: string;
  profilePhotoUrl?: string;
}

export function TopBar({ userName, profileLabel, propertyScope, profilePhotoUrl }: TopBarProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-blue-100 bg-white/95 px-6 backdrop-blur">
      {/* Page context / breadcrumb area */}
      <div>
        <p className="text-xs font-medium text-blue-500">Welcome back</p>
        <p className="text-sm font-bold text-slate-800">{propertyScope}</p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Property Dropdown */}
        <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700">
          {propertyScope}
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Notification */}
        <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700" aria-label="Open notifications">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Help */}
        <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700" aria-label="Open help">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{userName}</p>
            <p className="text-xs text-slate-500">{profileLabel}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 ring-2 ring-blue-50">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-blue-600">{initial}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
