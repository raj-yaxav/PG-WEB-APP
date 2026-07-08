/**
 * app/managers/page.tsx — Managers Page
 *
 * ─────────────────────────────────────────────────────
 * UI SPEC (from design image):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Full width with sidebar (left) + main content (right)
 *   - Background: slate-50
 *
 * Top Bar:
 *   - Search: "Search managers..."
 *   - Property tabs: All Properties (active), Main Branch, East Wing
 *   - Help icon, Notification bell, + Add Property button
 *
 * Page Header:
 *   - "Managers" title (bold, large)
 *   - "OWNER CONTROL" purple badge
 *
 * Content Grid (2 columns):
 *   LEFT: Create Manager Form
 *     - "Create Manager" heading with icon
 *     - Manager Name input
 *     - Login ID + Phone (2-column)
 *     - Email Address input
 *     - Initial Password input with toggle
 *     - "Create Manager Account" button
 *
 *   RIGHT: Manager Registry Table
 *     - "Manager Registry" + "4 Active Managers" badge
 *     - Filter + Export buttons
 *     - Table: MANAGER, LOGIN ID, PHONE, STATUS, ACTION
 *     - Rows with avatar, name, email, login ID badge, phone, status badge
 *     - Pagination
 *
 * Bottom Stats:
 *   - 98% Security Compliance Rate (+12%)
 *   - 2.4k Logs Handled (Monthly)
 * ─────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { CreateManagerForm } from "@/components/shared/CreateManagerForm";
import { ManagerRegistry } from "@/components/shared/ManagerRegistry";
import { StatsCards } from "@/components/layout/ManagerStatsCards";
import { createManager, getManagers } from "@/services/managerService";

interface Manager {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  loginId: string;
  status: "active" | "on_leave" | "inactive";
  avatar?: string;
  createdAt?: string;
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagers();
  }, []);

  async function fetchManagers() {
    try {
      setLoading(true);
      const response = await getManagers();
      setManagers(response.data.data || []);
    } catch (err) {
      console.error("Failed to load managers", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManager(formData: {
    name: string;
    email: string;
    phone: string;
    loginId: string;
    password: string;
  }) {
    try {
      const response = await createManager({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        loginId: formData.loginId.trim() || undefined,
        password: formData.password,
      });
      const manager = response.data.data.user;
      setManagers((current) => [manager, ...current]);
      return manager;
    } catch (err) {
      throw err;
    }
  }

  return (
    <AdminShell activeItem="managers">
          {/* Page Header */}
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Managers</h1>
            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-full">
              Owner Control
            </span>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
            {/* Left: Create Manager Form */}
            <CreateManagerForm onCreate={handleCreateManager} />

            {/* Right: Manager Registry */}
            <ManagerRegistry managers={managers} loading={loading} />
          </div>

          {/* Bottom Stats */}
          <StatsCards />
    </AdminShell>
  );
}



