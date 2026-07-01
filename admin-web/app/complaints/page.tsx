"use client";

/**
 * app/complaints/page.tsx — Complaints Management Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Complaints"
 *   - Stats bar: [Pending: N] [In Progress: N] [Resolved: N]
 *
 * Filters:
 *   - Property dropdown
 *   - Status filter: All | Pending | In Progress | Resolved
 *   - Category filter: All | Electricity | Water | WiFi | Cleaning | Food | Furniture | Other
 *   - Search by tenant name or complaint title
 *
 * Complaints Table:
 *   Columns:
 *     # | Tenant | Room | Category | Title | Status | Created Date | Actions
 *
 *   Row details:
 *     - Category icon (lightning bolt for electricity, droplet for water, etc.)
 *     - Status badge:
 *         pending = orange
 *         in_progress = blue
 *         resolved = green
 *     - Actions:
 *         [View] → opens detail modal
 *         [Update Status] → status dropdown + admin note
 *
 * Complaint Detail Modal:
 *   - Tenant name, phone, room, bed
 *   - Category and title
 *   - Description (full text)
 *   - Image (if available) — show thumbnail, click to enlarge
 *   - Status history (created → in progress → resolved)
 *   - Admin note (read-only display if set)
 *   - Update Status section:
 *       Status dropdown: pending | in_progress | resolved
 *       Admin note textarea
 *       [Update] button
 *
 * Update Status Flow:
 *   - Admin selects new status
 *   - Adds admin note (optional but recommended)
 *   - Submits → PATCH /api/complaints/:id/status
 *   - Table refreshes with new status
 *
 * Pagination:
 *   - 10 per page with Previous/Next
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getComplaints, updateComplaintStatus } from "@/services/complaintService";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getComplaints(params);
      setComplaints(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter]);

  const handleStatusUpdate = async (id: string, status: string, adminNote: string) => {
    try {
      await updateComplaintStatus(id, status, adminNote);
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Complaints</h1>

      {/* Status Filters */}
      <div>
        {["", "pending", "in_progress", "resolved"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading && <p>Loading complaints...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Room</th>
            <th>Category</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c._id}>
              <td>{c.tenantId?.name || "—"}</td>
              <td>{c.roomId?.roomNumber || "—"}</td>
              <td>{c.category}</td>
              <td>{c.title}</td>
              <td>{c.status}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              <td>
                {/* TODO: Replace with proper modal */}
                {c.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusUpdate(c._id, "resolved", "Resolved by admin")}
                  >
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>Complaints UI will be designed later.</p>
    </div>
  );
}
