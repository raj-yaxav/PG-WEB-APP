/**
 * Sidebar Component
 * 
 * Google-Drive-style sidebar: logo, nav list, a bottom plan card, and account actions.
 */

"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashboardRole } from "@/app/(admin)/dashboard/dashboardData";

interface SidebarProps {
  role: DashboardRole;
  activeItem: string;
  onItemClick: (item: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", roles: ["owner", "manager", "tenant"] },
  { id: "properties", label: "Properties", icon: "building", roles: ["owner"] },
  { id: "managers", label: "Managers", icon: "manager", roles: ["owner"] },
  { id: "tenants", label: "Tenants", icon: "users", roles: ["owner", "manager"] },
  { id: "rooms", label: "Rooms", icon: "bed", roles: ["manager"] },
  { id: "complaints", label: "Tenant Queries", icon: "alert", roles: ["manager"] },
  { id: "reports", label: "Reports", icon: "chart", roles: ["owner", "manager"] },
  { id: "complaints", label: "Support", icon: "alert", roles: ["tenant"] },
  { id: "profile", label: "Profile", icon: "profile", roles: ["owner", "manager", "tenant"] },
];

export function Sidebar({ role, activeItem, onItemClick, isOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));
  const roleCard = getRoleCard(role);
  const routeById: Record<string, string> = {
    dashboard: "/dashboard",
    properties: "/properties",
    managers: "/managers",
    rooms: "/rooms",
    tenants: "/tenants",
    payments: "/payments",
    complaints: "/complaints",
    reports: "/reports",
    profile: "/settings",
  };

  const handleLogout = () => {
    setLoggingOut(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem("pg_user");
      localStorage.removeItem("pg_token");
    }
    setTimeout(() => {
      router.push("/login");
    }, 400);
  };

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-40 flex h-screen max-h-screen w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden border-r border-blue-100 bg-white shadow-2xl shadow-blue-950/10 transition-transform duration-300 will-change-transform lg:z-30 lg:w-72 lg:translate-x-0 lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black text-slate-900">Roommzy</h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase -mt-0.5">Admin Portal</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pt-3 sm:px-4">
        <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onItemClick(item.id);
              router.push(routeById[item.id] || "/dashboard");
            }}
            className={cn(
              "flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200",
              activeItem === item.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            <SidebarIcon name={item.icon} active={activeItem === item.id} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom plan/usage card */}
      <div className="shrink-0 px-3 pb-4 sm:px-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#E2F0FF] p-4 text-slate-900 shadow-[8px_10px_24px_rgba(30,64,175,0.12)]">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative flex items-center gap-2">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m4-10h1m-1 4h1" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-blue-700">Role workspace</p>
              <p className="text-sm font-bold">{roleCard.title}</p>
            </div>
          </div>
          <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full bg-blue-600" style={{ width: roleCard.progress }} />
          </div>
          <Link
            href={role === "manager" ? "/complaints" : "/reports"}
            className="relative mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 transition hover:text-blue-900"
          >
            {role === "manager" ? "Open issues" : "View reports"}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Account Actions */}
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-blue-100 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="group flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm active:translate-y-0"
        >
          <svg className="h-4 w-4 text-slate-400 transition-colors group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 8a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Profile
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "group flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200",
            loggingOut
              ? "border-red-100 bg-red-50 text-red-500"
              : "border-red-100 bg-white text-red-500 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0"
          )}
        >
          {loggingOut && (
            <svg className="h-4 w-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}

          {!loggingOut && (
            <svg
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}

          <span>{loggingOut ? "Wait..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}

function getRoleCard(role: DashboardRole) {
  if (role === "manager") {
    return { title: "Issues and reports", progress: "62%" };
  }
  if (role === "tenant") {
    return { title: "Stay and support", progress: "50%" };
  }
  return { title: "Reports and properties", progress: "74%" };
}

function SidebarIcon({ name, active }: { name: string; active: boolean }) {
  const colorClass = active ? "text-white" : "text-slate-400";

  const icons: Record<string, ReactNode> = {
    dashboard: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    building: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    bed: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
      </svg>
    ),
    users: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    manager: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 8a3 3 0 11-6 0 3 3 0 016 0zm4 3h2m-1-1v2" />
      </svg>
    ),
    wallet: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    alert: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    chart: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    profile: (
      <svg className={`h-5 w-5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 8a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return icons[name] || null;
}
