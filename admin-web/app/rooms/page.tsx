"use client";

/**
 * app/rooms/page.tsx — Rooms & Beds Management Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Rooms & Beds" + "+ Add Room" button
 *   - Property selector dropdown (filter by property)
 *
 * Filters:
 *   - Floor filter dropdown (Ground, 1st, 2nd, etc.)
 *   - Status filter: All | Active | Maintenance | Inactive
 *   - Search by room number
 *
 * Room Cards Grid (2-3 columns):
 *   Each Room Card:
 *     - Room number (large, prominent)
 *     - Floor label
 *     - Room type badge (Single / Double / Triple / 4-Sharing)
 *     - Rent per bed: ₹X,XXX/month
 *     - Facilities chips (AC, Attached WC, Furnished...)
 *     - Status badge (Active / Maintenance / Inactive)
 *     - Bed badges inside card:
 *         [A] [B] [C] color coded by status:
 *         vacant = green badge
 *         occupied = blue badge
 *         booked = yellow badge
 *         maintenance = red/gray badge
 *     - Clickable bed badge → show tenant details
 *     - [+ Add Bed] button inside card
 *     - [Edit Room] | [Delete Room] icons
 *
 * Add Room Form (Modal):
 *   Fields:
 *     - Property* (dropdown)
 *     - Room Number* (text)
 *     - Floor (text)
 *     - Room Type* (dropdown: single/double/triple/four_sharing/other)
 *     - Rent Per Bed* (number)
 *     - Facilities (multi-select: AC, Non-AC, Attached WC, Balcony, Furnished)
 *     - Status (Active / Maintenance / Inactive)
 *   Buttons: [Cancel] [Create Room]
 *
 * Add Bed Form (Modal):
 *   Fields:
 *     - Bed Number* (text: A, B, 1, 2...)
 *   Buttons: [Cancel] [Add Bed]
 *
 * Bed Assignment:
 *   - Click vacant bed → "Assign Tenant" button appears
 *   - Opens tenant search modal
 *   - Search and select tenant to assign
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getRooms, getBeds } from "@/services/roomService";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Rooms & Beds</h1>

      {loading && <p>Loading rooms...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {rooms.map((room) => (
        <div key={room._id}>
          <h2>Room {room.roomNumber}</h2>
          <p>Floor: {room.floor} | Type: {room.roomType}</p>
          <p>Rent/Bed: ₹{room.rentPerBed}</p>
          <p>Status: {room.status}</p>
        </div>
      ))}

      <p>Rooms & Beds UI will be designed later.</p>
    </div>
  );
}
