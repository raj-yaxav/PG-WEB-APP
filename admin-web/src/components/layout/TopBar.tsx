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
  onMenuClick?: () => void;
}

export function TopBar({ userName, profileLabel, propertyScope, profilePhotoUrl, onMenuClick }: TopBarProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-blue-100 bg-white/95 px-3 py-2 backdrop-blur sm:px-5 lg:px-6">
      {/* Page context / breadcrumb area */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-500">Welcome back</p>
          <p className="truncate text-sm font-bold text-slate-800">{propertyScope}</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
        {/* Property Dropdown */}
        <button className="hidden max-w-56 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 md:flex">
          <span className="truncate">{propertyScope}</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Notification */}
        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700" aria-label="Open notifications">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Help */}
        <button className="hidden h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 sm:flex" aria-label="Open help">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* User Profile */}
        <div className="flex min-w-0 items-center gap-2 border-l border-slate-200 pl-2 sm:gap-3 sm:pl-4">
          <div className="hidden max-w-36 text-right sm:block">
            <p className="text-sm font-semibold text-slate-700">{userName}</p>
            <p className="text-xs text-slate-500">{profileLabel}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 ring-2 ring-blue-50">
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
