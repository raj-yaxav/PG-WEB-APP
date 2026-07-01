"use client";

/**
 * app/tenants/page.tsx — Tenants Management Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Tenants" + "+ Add Tenant" button (top right)
 *
 * Filters/Search:
 *   - Search input: search by name or phone
 *   - Status filter tabs: All | Active | Notice | Left
 *   - Property filter dropdown
 *
 * Tenants Table:
 *   Columns:
 *     Photo | Name | Phone | Room | Bed | Rent/month | Status | Joining Date | Actions
 *
 *   Row details:
 *     - Tenant photo avatar (circular, small)
 *     - Status badges:
 *         active = green
 *         notice = yellow/orange
 *         left = gray/red
 *     - Actions per row:
 *         [View Profile] [Edit] [Assign Bed] [Mark Left]
 *
 * Add Tenant Form (Modal or Slide-over panel):
 *   Required fields:
 *     - Name*
 *     - Phone*
 *     - Rent Amount* (₹)
 *     - Property* (dropdown)
 *   Optional fields:
 *     - Email
 *     - Guardian Phone
 *     - Emergency Contact
 *     - Permanent Address
 *     - Security Deposit (₹)
 *     - Joining Date (date picker)
 *     - Profile Photo (upload → Cloudinary later)
 *     - KYC Document (upload → Cloudinary later)
 *   Buttons: [Cancel] [Create Tenant]
 *
 * View Tenant Profile (Modal or new page):
 *   - Profile photo (large)
 *   - Full details
 *   - KYC status badge + document viewer
 *   - Current room and bed info
 *   - Payment history tab
 *   - Complaint history tab
 *
 * Assign Bed:
 *   - Opens bed selector (shows only vacant/booked beds for the property)
 *   - Click bed to assign
 *
 * Mark Left:
 *   - Confirmation dialog
 *   - On confirm: tenant.status → left, bed freed
 *
 * Pagination:
 *   - 10 per page, page navigation
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getTenants } from "@/services/tenantService";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await getTenants({ status: statusFilter });
        setTenants(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load tenants");
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, [statusFilter]);

  return (
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Tenants</h1>

      {/* Status Filter */}
      <div>
        {["active", "notice", "left"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading && <p>Loading tenants...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Room</th>
            <th>Bed</th>
            <th>Rent</th>
            <th>Status</th>
            <th>Joining Date</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant._id}>
              <td>{tenant.name}</td>
              <td>{tenant.phone}</td>
              <td>{tenant.roomId?.roomNumber || "—"}</td>
              <td>{tenant.bedId?.bedNumber || "—"}</td>
              <td>₹{tenant.rentAmount}</td>
              <td>{tenant.status}</td>
              <td>{tenant.joiningDate ? new Date(tenant.joiningDate).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>Tenants UI will be designed later.</p>
    </div>
  );
}
