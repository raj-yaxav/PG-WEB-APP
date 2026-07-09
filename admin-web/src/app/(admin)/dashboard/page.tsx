/**
 * app/dashboard/page.tsx — Admin Overview Dashboard
 *
 * ─────────────────────────────────────────────────────
 * UI SPEC (from design image):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Full width layout with sidebar (left) + main content (right)
 *   - Background: slate-50 (#F8FAFC)
 *   - Sidebar: white, fixed width ~240px
 *
 * Top Bar:
 *   - Search input: "Search tenant or room..."
 *   - "ALL PROPERTIES" dropdown
 *   - "Add Property" purple button with +
 *   - Notification bell icon
 *   - Help/info icon
 *   - Admin User avatar + "Property Manager"
 *
 * Stats Row (6 cards):
 *   - Total Rooms: 48 (+2 Mo badge)
 *   - Total Beds: 192
 *   - Occupied: 158 (82% FULL green)
 *   - Vacant: 34
 *   - Booked: 12
 *   - Service Issues: 6 (orange)
 *
 * Middle Section:
 *   - Left: Detailed Occupancy Status
 *     - Warning banner (red) with RETRY SYNC
 *     - Room type breakdown with progress bars
 *   - Right: Rent Tracking (purple gradient card)
 *     - Collected amount, progress bar
 *     - Target vs Dues
 *     - Payment Reminders button
 *
 * Bottom Section:
 *   - Left: Pending Dues table
 *   - Right: Open Complaints (All Clear state)
 *
 * Colors:
 *   - Primary: #4F46E5 (indigo-600)
 *   - Success: #22C55E
 *   - Warning: #F97316
 *   - Background: #F8FAFC
 *   - Cards: #FFFFFF
 * ─────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { getStoredUser } from "@/services/authService";
import { getDashboardSummary } from "@/services/dashboardService";
import { StatsCards } from "@/components/layout/StatsCards";
import { OccupancyStatus } from "./components/OccupancyStatus";
import { RentTracking } from "./components/RentTracking";
import { PendingDues } from "./components/PendingDues";
import { OpenComplaints } from "./components/OpenComplaints";
import {
  applyDashboardSummary,
  getDashboardData,
  type DashboardData,
  type DashboardSummary,
  type DashboardUser,
} from "./dashboardData";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}

export default function DashboardPage() {
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getStoredUser() as DashboardUser | null;
  }, []);
  const baseDashboard = useMemo(() => getDashboardData(user), [user]);
  const [dashboard, setDashboard] = useState<DashboardData>(baseDashboard);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    setDashboard(baseDashboard);
  }, [baseDashboard]);

  useEffect(() => {
    let isCurrent = true;

    async function loadSummary() {
      setIsLoadingSummary(true);
      setSummaryError("");

      try {
        const response = await getDashboardSummary();
        const summary = response.data?.data as DashboardSummary | undefined;

        if (isCurrent && summary) {
          setDashboard(applyDashboardSummary(baseDashboard, summary));
        }
      } catch (error) {
        if (!isCurrent) return;
        const message = getApiErrorMessage(error, "Live dashboard data could not be loaded.");
        setSummaryError(`${message} Showing empty dashboard until live data is available.`);
        toast.error(message);
      } finally {
        if (isCurrent) setIsLoadingSummary(false);
      }
    }

    loadSummary();

    return () => {
      isCurrent = false;
    };
  }, [baseDashboard]);

  const primaryAction = getPrimaryDashboardAction(dashboard.role);

  return (
    <>
          <section className="relative mb-6 overflow-hidden rounded-[28px] border border-blue-200/80 bg-[#B9D9FA] p-5 shadow-[14px_18px_38px_rgba(30,64,175,0.18),inset_8px_8px_18px_rgba(255,255,255,0.42),inset_-10px_-10px_22px_rgba(37,99,235,0.12)] sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/35 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-blue-700/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex rounded-full bg-white/60 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-blue-800 shadow-[inset_3px_3px_8px_rgba(255,255,255,0.55)]">
                  {dashboard.profileLabel} workspace
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{dashboard.title}</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700">{dashboard.subtitle}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[390px]">
                <Link
                  href={primaryAction.href}
                  className="group flex min-h-20 items-center gap-3 rounded-2xl bg-blue-700 px-4 py-3 text-white shadow-[10px_12px_26px_rgba(29,78,216,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <ActionIcon name={primaryAction.icon} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{primaryAction.label}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-blue-100">{primaryAction.caption}</span>
                  </span>
                </Link>
                <Link
                  href={primaryAction.secondaryHref}
                  className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-slate-800 shadow-[8px_10px_24px_rgba(30,64,175,0.08),inset_5px_5px_12px_rgba(255,255,255,0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <ActionIcon name={primaryAction.secondaryIcon} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{primaryAction.secondaryLabel}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">{primaryAction.secondaryCaption}</span>
                  </span>
                </Link>
              </div>
            </div>
          </section>

          {(isLoadingSummary || summaryError) && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[8px_10px_24px_rgba(30,64,175,0.08)] ${
                summaryError
                  ? "border-red-100 bg-red-50 text-red-600"
                  : "border-sky-100 bg-sky-50 text-sky-700"
              }`}
            >
              {summaryError || "Loading live dashboard data..."}
            </div>
          )}

          <RoleShortcuts role={dashboard.role} />

          {/* Stats Cards */}
          <StatsCards stats={dashboard.stats} />

          {/* Middle Section: Occupancy + Rent Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <OccupancyStatus roomTypes={dashboard.roomTypes} role={dashboard.role} />
            </div>
            <div className="lg:col-span-1">
              <RentTracking rent={dashboard.rent} />
            </div>
          </div>

          {/* Bottom Section: Pending Dues + Open Complaints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <PendingDues dues={dashboard.dues} role={dashboard.role} />
            <OpenComplaints openCount={dashboard.complaintsOpen} message={dashboard.complaintsMessage} />
          </div>
    </>
  );
}

function RoleShortcuts({ role }: { role: DashboardData["role"] }) {
  const shortcuts =
    role === "owner"
      ? [
          { label: "Add Property", value: "Create a PG branch", href: "/properties?action=create", icon: "building" },
          { label: "Properties", value: "Manage PG locations", href: "/properties", icon: "building" },
          { label: "Managers", value: "Assign branch staff", href: "/managers", icon: "manager" },
          { label: "Current Tenants", value: "Active residents", href: "/tenants", icon: "users" },
          { label: "Manager Reports", value: "Review updates", href: "/reports", icon: "chart" },
        ]
      : role === "manager"
        ? [
            { label: "Add Tenant", value: "Onboard resident", href: "/tenants?action=create", icon: "users" },
            { label: "Rooms & Beds", value: "Create inventory", href: "/rooms", icon: "bed" },
            { label: "Tenant Queries", value: "Update complaint status", href: "/complaints", icon: "alert" },
            { label: "Manager Reports", value: "Send updates to owner", href: "/reports", icon: "chart" },
          ]
        : [
            { label: "My Room", value: "Stay details", href: "/dashboard", icon: "bed" },
            { label: "Support", value: "Raise and track query", href: "/complaints", icon: "alert" },
            { label: "Profile", value: "Update your account", href: "/settings", icon: "profile" },
          ];

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {shortcuts.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group rounded-[24px] border border-blue-100 bg-[#E2F0FF] p-4 shadow-[10px_12px_28px_rgba(30,64,175,0.10),inset_7px_7px_16px_rgba(255,255,255,0.65),inset_-8px_-8px_18px_rgba(37,99,235,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-[inset_4px_4px_10px_rgba(191,219,254,0.6)]">
              <ActionIcon name={item.icon} />
            </span>
            <span className="mt-1 inline-flex text-xs font-black text-blue-700 transition group-hover:translate-x-0.5">Open</span>
          </div>
          <p className="mt-4 text-sm font-black text-slate-900">{item.label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.value}</p>
        </Link>
      ))}
    </div>
  );
}

function getPrimaryDashboardAction(role: DashboardData["role"]) {
  if (role === "manager") {
    return {
      label: "Add Tenant",
      caption: "Assign a vacant bed",
      href: "/tenants?action=create",
      icon: "users",
      secondaryLabel: "Write Report",
      secondaryCaption: "Update the owner",
      secondaryHref: "/reports",
      secondaryIcon: "chart",
    };
  }

  if (role === "tenant") {
    return {
      label: "Open Support",
      caption: "Raise a tenant query",
      href: "/complaints",
      icon: "alert",
      secondaryLabel: "My Profile",
      secondaryCaption: "Photo and account",
      secondaryHref: "/settings",
      secondaryIcon: "profile",
    };
  }

  return {
    label: "Add Property",
    caption: "Create a new PG branch",
    href: "/properties?action=create",
    icon: "building",
    secondaryLabel: "Manager Reports",
    secondaryCaption: "Review updates",
    secondaryHref: "/reports",
    secondaryIcon: "chart",
  };
}

function ActionIcon({ name }: { name: string }) {
  const className = "h-5 w-5";
  const icons: Record<string, ReactNode> = {
    building: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a5 5 0 00-7.5-4.33M9 20H2v-1a5 5 0 017.5-4.33M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM8 10a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    manager: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a6 6 0 00-6 6h12a6 6 0 00-6-6zm0-2a4 4 0 100-8 4 4 0 000 8zm7-1h3m-1.5-1.5v3" />
      </svg>
    ),
    bed: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11V7a3 3 0 013-3h3a3 3 0 013 3v4m0-3h4a3 3 0 013 3v6M4 21v-4m18 4v-4M3 17h18M4 11h18" />
      </svg>
    ),
    alert: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m8-2a9 9 0 11-4.2-7.6L21 4l-1.4 4.2A8.96 8.96 0 0121 12z" />
      </svg>
    ),
    chart: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7" />
      </svg>
    ),
    profile: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0" />
      </svg>
    ),
  };

  return icons[name] || icons.chart;
}
