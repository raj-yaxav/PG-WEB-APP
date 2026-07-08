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

  return (
    <>
          <div className="mb-6 rounded-2xl border border-blue-100 bg-[#B9D9FA] p-6 shadow-[8px_10px_28px_rgba(30,64,175,0.16)]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">{dashboard.profileLabel} workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{dashboard.title}</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-700">{dashboard.subtitle}</p>
          </div>

          {(isLoadingSummary || summaryError) && (
            <div
              className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${
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
          { label: "Properties", value: "PG locations", href: "/properties" },
          { label: "Current Tenants", value: "Active residents", href: "/tenants" },
          { label: "Manager Reports", value: "Review updates", href: "/complaints?view=reports" },
        ]
      : role === "manager"
        ? [
            { label: "Add Tenant", value: "Onboard resident", href: "/tenants?action=create" },
            { label: "Add Room", value: "Create inventory", href: "/rooms?action=create-room" },
            { label: "Add Bed", value: "Attach to a room", href: "/rooms?action=add-bed" },
            { label: "Issues", value: "Update complaints", href: "/complaints" },
          ]
        : [
            { label: "My Room", value: "Stay details", href: "/dashboard" },
            { label: "Complaints", value: "Raise and track", href: "/complaints" },
          ];

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {shortcuts.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group rounded-2xl border border-blue-100 bg-[#E2F0FF] p-5 shadow-[8px_10px_24px_rgba(30,64,175,0.08)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
        >
          <p className="text-sm font-black text-slate-900">{item.label}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{item.value}</p>
          <span className="mt-4 inline-flex text-xs font-bold text-blue-700 transition group-hover:translate-x-1">Open</span>
        </Link>
      ))}
    </div>
  );
}
