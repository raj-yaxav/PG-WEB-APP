"use client";

/**
 * app/properties/page.tsx — Properties Management Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Properties" title + "+ Add Property" button (top right)
 *
 * Filters/Search Bar:
 *   - Search input: search by property name or city
 *   - Status filter dropdown: All | Active | Inactive
 *
 * Property Cards/Table (toggle between card and table view):
 *   Card View:
 *     - Property name (bold heading)
 *     - City, State, Pincode
 *     - Address
 *     - Contact phone (clickable)
 *     - Facilities chips (WiFi, CCTV, etc.)
 *     - Status badge (green = active, gray = inactive)
 *     - Action buttons: [Edit] [Delete]
 *
 *   Table View Columns:
 *     Name | City | Address | Phone | Facilities | Status | Actions
 *
 * Add Property Modal/Form:
 *   Fields:
 *     - Property Name* (required)
 *     - Address
 *     - City
 *     - State
 *     - Pincode
 *     - Contact Phone
 *     - Facilities (multi-select chips: WiFi, CCTV, Parking, Laundry...)
 *     - Status (Active/Inactive toggle)
 *   Buttons: [Cancel] [Save Property]
 *
 * Edit Property:
 *   - Same form pre-filled with existing data
 *   - Open in modal on Edit click
 *
 * Delete:
 *   - Show confirmation dialog before deleting
 *
 * Pagination:
 *   - Show 10 per page
 *   - Previous / Next buttons
 *   - Page number indicator
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get("/properties");
        setProperties(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Properties</h1>

      {loading && <p>Loading properties...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {properties.map((property) => (
        <div key={property._id}>
          <h2>{property.name}</h2>
          <p>{property.city}, {property.state}</p>
          <p>Status: {property.status}</p>
        </div>
      ))}

      <p>Properties UI will be designed later.</p>
    </div>
  );
}
