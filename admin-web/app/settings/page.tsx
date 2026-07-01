"use client";

/**
 * app/settings/page.tsx — Settings & Profile Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Settings & Profile"
 *   - Two column layout (left: profile card, right: settings sections)
 *
 * Left Column — Profile Card:
 *   - Profile avatar (circular, large)
 *   - User name (bold)
 *   - Phone number
 *   - Role badge (Owner / Manager)
 *   - Account status (Active / Inactive)
 *   - [Logout] button (red, prominent)
 *
 * Right Column — Settings Sections:
 *
 *   Section 1: Personal Information
 *     - Name (editable text field)
 *     - Phone (read-only in V1)
 *     - Email (editable)
 *     - [Save Changes] button
 *
 *   Section 2: Change Password (V2 — placeholder)
 *     - Current Password
 *     - New Password
 *     - Confirm Password
 *     - [Change Password] button (disabled in V1)
 *     - Note: "Password change feature coming soon"
 *
 *   Section 3: Property Settings (V2 — placeholder)
 *     - Default property selector
 *     - Notification preferences
 *     - Note: "Property settings coming soon"
 *
 *   Section 4: App Info
 *     - Version: 1.0.0
 *     - Built with: Node.js, Next.js, MongoDB
 *     - Support email / contact
 *
 * Logout Flow:
 *   - Click [Logout]
 *   - Confirmation dialog: "Are you sure you want to logout?"
 *   - On confirm: clear localStorage (token + user)
 *   - Redirect to /login
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getMe, clearAuthData } from "@/services/authService";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearAuthData();
      window.location.href = "/login";
    }
  };

  return (
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Settings & Profile</h1>

      {loading && <p>Loading profile...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>Phone: {user.phone}</p>
          <p>Email: {user.email || "Not set"}</p>
          <p>Role: {user.role}</p>
          <p>Status: {user.status}</p>
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout} style={{ color: "red" }}>
        Logout
      </button>

      {/* Placeholders for future settings */}
      <div>
        <h3>Change Password</h3>
        <p>Feature coming soon in V2</p>
      </div>

      <div>
        <h3>Property Settings</h3>
        <p>Feature coming soon in V2</p>
      </div>

      <div>
        <h3>App Info</h3>
        <p>Version: 1.0.0</p>
        <p>PG Room Management System</p>
      </div>

      <p>Settings & Profile UI will be designed later.</p>
    </div>
  );
}
