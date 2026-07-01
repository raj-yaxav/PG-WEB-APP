"use client";

/**
 * app/dashboard/page.tsx — Dashboard Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Top header bar with app name + user name + logout button
 *   - Left sidebar navigation (collapsible on mobile)
 *   - Main content area
 *
 * Filters (top of page):
 *   - Property dropdown (select property)
 *   - Month picker
 *   - Year picker
 *   - "Apply Filters" button
 *
 * Summary Cards (grid, 3 or 4 columns):
 *   Card 1: Total Rooms (icon: door)
 *   Card 2: Total Beds (icon: bed)
 *   Card 3: Occupied Beds (blue)
 *   Card 4: Vacant Beds (green)
 *   Card 5: Booked Beds (yellow)
 *   Card 6: Maintenance Beds (gray)
 *   Card 7: Active Tenants (purple)
 *   Card 8: Monthly Expected Rent (₹)
 *   Card 9: Monthly Collected Rent (green ₹)
 *   Card 10: Pending Dues (red ₹)
 *   Card 11: Open Complaints (orange)
 *
 * Charts / Tables:
 *   - Occupancy Bar Chart (rooms × beds status) — add chart library later
 *   - Pending Dues Table:
 *       Columns: Tenant Name, Phone, Room, Bed, Month, Amount Due
 *   - Open Complaints Table:
 *       Columns: Tenant, Room, Category, Title, Status, Date
 *
 * Colors:
 *   - Paid / Active / Occupied → Green
 *   - Unpaid / Pending → Red
 *   - Partial / Notice → Yellow/Orange
 *   - Maintenance → Gray
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/services/dashboardService";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getDashboardSummary();
        setSummary(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div>
      {/* 
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Dashboard</h1>

      {loading && <p>Loading dashboard data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {summary && (
        <div>
          {/* Rooms & Beds */}
          <p>Total Rooms: {summary.rooms?.totalRooms}</p>
          <p>Total Beds: {summary.beds?.totalBeds}</p>
          <p>Occupied Beds: {summary.beds?.occupiedBeds}</p>
          <p>Vacant Beds: {summary.beds?.vacantBeds}</p>
          <p>Booked Beds: {summary.beds?.bookedBeds}</p>
          <p>Maintenance Beds: {summary.beds?.maintenanceBeds}</p>

          {/* Tenants */}
          <p>Active Tenants: {summary.tenants?.activeTenants}</p>

          {/* Rent */}
          <p>Monthly Expected Rent: ₹{summary.rent?.monthlyExpectedRent}</p>
          <p>Monthly Collected Rent: ₹{summary.rent?.monthlyCollectedRent}</p>
          <p>Pending Dues: ₹{summary.rent?.pendingDues}</p>

          {/* Complaints */}
          <p>Open Complaints: {summary.complaints?.openComplaints}</p>
        </div>
      )}

      <p>Dashboard UI will be designed later.</p>
    </div>
  );
}
