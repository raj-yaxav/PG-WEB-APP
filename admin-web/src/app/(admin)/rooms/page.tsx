"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import { createBed, createRoom, deleteBed, getBeds, getRooms } from "@/services/roomService";
import { AdminShell } from "@/components/layout/AdminShell";

interface Property {
  _id: string;
  name: string;
  city?: string;
}

interface Room {
  _id: string;
  propertyId: string | Property;
  roomNumber: string;
  floor?: string;
  roomType: "single" | "double" | "triple" | "four_sharing" | "other";
  rentPerBed: number;
  facilities?: string[];
  status: "active" | "maintenance" | "inactive";
}

interface Bed {
  _id: string;
  propertyId: string;
  roomId: string | { _id?: string; roomNumber?: string };
  bedNumber: string;
  status: "vacant" | "occupied" | "booked" | "maintenance";
  tenantId?: { _id?: string; name?: string; phone?: string } | null;
}

const emptyRoomForm = {
  propertyId: "",
  roomNumber: "",
  floor: "",
  roomType: "single" as Room["roomType"],
  rentPerBed: "",
  facilities: "",
  status: "active" as Room["status"],
};

export default function RoomsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [bedInputs, setBedInputs] = useState<Record<string, string>>({});
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "create-room") {
      setShowRoomForm(true);
    }
    if (action === "add-bed") {
      setSuccess("Choose a room below and add a bed from its Add Bed field.");
    }
  }, []);

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rooms.filter((room) => {
      const propertyId = getPropertyId(room.propertyId);
      const matchesSearch = !term || room.roomNumber.toLowerCase().includes(term) || room.floor?.toLowerCase().includes(term);
      const matchesProperty = !propertyFilter || propertyId === propertyFilter;
      const matchesStatus = !statusFilter || room.status === statusFilter;
      return matchesSearch && matchesProperty && matchesStatus;
    });
  }, [rooms, search, propertyFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const totalBeds = beds.length;
    const vacant = beds.filter((b) => b.status === "vacant").length;
    const occupied = beds.filter((b) => b.status === "occupied").length;
    return { totalRooms, totalBeds, vacant, occupied };
  }, [rooms, beds]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError("");
      const [propertiesRes, roomsRes, bedsRes] = await Promise.all([
        api.get("/properties"),
        getRooms(),
        getBeds(),
      ]);
      setProperties(propertiesRes.data.data || []);
      setRooms(roomsRes.data.data || []);
      setBeds(bedsRes.data.data || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load rooms and beds"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!roomForm.propertyId || !roomForm.roomNumber.trim() || !roomForm.rentPerBed) {
      setError("Property, room number, and rent per bed are required");
      return;
    }

    try {
      setSaving(true);
      const response = await createRoom({
        propertyId: roomForm.propertyId,
        roomNumber: roomForm.roomNumber.trim(),
        floor: roomForm.floor.trim(),
        roomType: roomForm.roomType,
        rentPerBed: Number(roomForm.rentPerBed),
        facilities: roomForm.facilities.split(",").map((item) => item.trim()).filter(Boolean),
        status: roomForm.status,
      });
      setRooms((current) => [response.data.data, ...current]);
      setRoomForm(emptyRoomForm);
      setShowRoomForm(false);
      setSuccess("Room created successfully");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create room"));
    } finally {
      setSaving(false);
    }
  }

  function closeRoomForm() {
    setRoomForm(emptyRoomForm);
    setShowRoomForm(false);
    setError("");
  }

  async function handleCreateBed(room: Room) {
    const bedNumber = (bedInputs[room._id] || "").trim();
    if (!bedNumber) {
      setError("Bed number is required");
      return;
    }

    try {
      setError("");
      setSuccess("");
      const response = await createBed({
        propertyId: getPropertyId(room.propertyId),
        roomId: room._id,
        bedNumber,
      });
      setBeds((current) => [response.data.data, ...current]);
      setBedInputs((current) => ({ ...current, [room._id]: "" }));
      setSuccess(`Bed ${bedNumber} added to room ${room.roomNumber}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create bed"));
    }
  }

  async function handleDeleteBed(bed: Bed, room: Room) {
    if (bed.tenantId) {
      setError(`Bed ${bed.bedNumber} is assigned to ${bed.tenantId.name || "a tenant"}. Remove the tenant assignment first.`);
      return;
    }

    if (bed.status !== "vacant") {
      setError(`Only vacant beds can be deleted. Bed ${bed.bedNumber} is currently ${bed.status}.`);
      return;
    }

    if (!window.confirm(`Delete Bed ${bed.bedNumber} from Room ${room.roomNumber}? This cannot be undone.`)) return;

    try {
      setError("");
      setSuccess("");
      await deleteBed(bed._id);
      setBeds((current) => current.filter((item) => item._id !== bed._id));
      setSuccess(`Bed ${bed.bedNumber} removed from room ${room.roomNumber}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete bed"));
    }
  }

  return (
    <AdminShell
      activeItem="rooms"
      render={({ role }) => {
        const canManageRooms = role === "owner" || role === "manager";

        return (
      <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Inventory</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Rooms & Beds</h1>
            <p className="mt-1 text-sm text-slate-500">
              {canManageRooms ? "Create rooms, add beds, and track bed status." : "View room and bed availability."}
            </p>
          </div>
          {canManageRooms && (
            <button
              type="button"
              onClick={() => setShowRoomForm(true)}
              className="h-11 rounded-lg bg-sky-600 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-200"
            >
              + Add Room
            </button>
          )}
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Rooms" value={stats.totalRooms} color="border-l-sky-500 bg-sky-50/70" text="text-sky-800" />
          <StatCard label="Total Beds" value={stats.totalBeds} color="border-l-blue-500 bg-blue-50/70" text="text-blue-800" />
          <StatCard label="Vacant Beds" value={stats.vacant} color="border-l-cyan-500 bg-cyan-50/70" text="text-cyan-800" />
          <StatCard label="Occupied Beds" value={stats.occupied} color="border-l-slate-500 bg-slate-50" text="text-slate-700" />
        </div>

        {(error || success) && !showRoomForm && (
          <div className={`rounded-lg border-l-4 px-4 py-3 text-sm font-medium ${error ? "border-l-red-500 bg-red-50 text-red-700" : "border-l-cyan-500 bg-cyan-50 text-cyan-800"}`}>
            {error || success}
          </div>
        )}

        {/* Filter bar */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-slate-900">Room List</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room or floor" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
              </div>
              <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                <option value="">All Properties</option>
                {properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {/* Room grid */}
        <div className="grid gap-5 xl:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />)
          ) : filteredRooms.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">No rooms found.</div>
          ) : (
            filteredRooms.map((room) => {
              const roomBeds = beds.filter((bed) => getRoomId(bed.roomId) === room._id);
              const occupied = roomBeds.filter((b) => b.status === "occupied").length;
              const total = roomBeds.length;
              const occupancyPct = total ? Math.round((occupied / total) * 100) : 0;
              const statusMeta = roomStatusMeta(room.status);

              return (
                <article
                  key={room._id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-100"
                >
                  <div className="flex items-center justify-between px-5 py-4 transition-colors duration-300" style={{ backgroundColor: statusMeta.bg }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-black shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ color: statusMeta.text }}>
                        {room.roomNumber}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{getPropertyName(room.propertyId)}</p>
                        <p className="text-xs text-slate-500">{room.floor ? `Floor ${room.floor}` : "Ground Floor"} &middot; {formatRoomType(room.roomType)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize shadow-sm" style={{ color: statusMeta.text }}>
                      {room.status}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors duration-300 group-hover:border-sky-100 group-hover:bg-sky-50/50">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rent per bed</p>
                        <p className="text-2xl font-black text-slate-900">₹{room.rentPerBed.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="w-32 text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Occupancy</p>
                        <p className="text-sm font-bold text-slate-700">{occupied}/{total} beds</p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${occupancyPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {(room.facilities || []).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(room.facilities || []).map((facility) => (
                          <span key={facility} className="cursor-default rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 hover:shadow-sm">
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Beds</p>
                      {roomBeds.length === 0 ? (
                        <p className="text-sm text-slate-400">No beds added yet</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {roomBeds.map((bed) => {
                            const meta = bedStatusMeta(bed.status);
                            const canDeleteBed = bed.status === "vacant" && !bed.tenantId;
                            return (
                              <div key={bed._id} title={bed.tenantId?.name || bed.status} className="group/bed relative flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1 py-2.5 text-center transition-all duration-200 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-md" style={{ borderColor: meta.border, backgroundColor: meta.bg }}>
                                <span className="text-sm font-black" style={{ color: meta.text }}>{bed.bedNumber}</span>
                                <span className="max-w-full truncate px-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.text }}>
                                  {bed.status === "occupied" && bed.tenantId?.name ? bed.tenantId.name : bed.status}
                                </span>
                                {canManageRooms ? (
                                  <div className="mt-1 flex flex-col items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBed(bed, room)}
                                      disabled={!canDeleteBed}
                                      title={canDeleteBed ? `Delete Bed ${bed.bedNumber}` : "Only vacant unassigned beds can be deleted"}
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black transition ${
                                        canDeleteBed
                                          ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                                          : "cursor-not-allowed border-slate-200 bg-white/60 text-slate-300"
                                      }`}
                                    >
                                      x
                                    </button>
                                    {bed.status === "occupied" && bed.tenantId?.name ? (
                                      <Link
                                        href={`/tenants?search=${encodeURIComponent(bed.tenantId.name)}&changeBed=1`}
                                        className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-black text-blue-700 transition hover:bg-blue-50"
                                      >
                                        Change bed
                                      </Link>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {canManageRooms && (
                      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                        <input
                          value={bedInputs[room._id] || ""}
                          onChange={(event) => setBedInputs((current) => ({ ...current, [room._id]: event.target.value }))}
                          placeholder="New bed number, e.g. C"
                          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        />
                        <button type="button" onClick={() => handleCreateBed(room)} className="h-10 shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-200 active:translate-y-0">
                          Add Bed
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" style={{ backgroundColor: statusMeta.text }} />
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Add Room modal */}
      {showRoomForm && canManageRooms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add Room</h2>
                  <p className="text-xs text-slate-500">Create a new room under a property.</p>
                </div>
              </div>
              <button onClick={closeRoomForm} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6">
              {error && <div className="mb-4 rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Property</span>
                  <select value={roomForm.propertyId} onChange={(event) => setRoomForm((current) => ({ ...current, propertyId: event.target.value }))} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                    <option value="">Select property</option>
                    {properties.map((property) => (
                      <option key={property._id} value={property._id}>{property.name}</option>
                    ))}
                  </select>
                </label>
                <Field label="Room Number" value={roomForm.roomNumber} placeholder="101" onChange={(roomNumber) => setRoomForm((current) => ({ ...current, roomNumber }))} />
                <Field label="Floor" value={roomForm.floor} placeholder="1st" onChange={(floor) => setRoomForm((current) => ({ ...current, floor }))} />
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Room Type</span>
                  <select value={roomForm.roomType} onChange={(event) => setRoomForm((current) => ({ ...current, roomType: event.target.value as Room["roomType"] }))} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="four_sharing">Four Sharing</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <Field label="Rent Per Bed" value={roomForm.rentPerBed} placeholder="6500" type="number" onChange={(rentPerBed) => setRoomForm((current) => ({ ...current, rentPerBed }))} />
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
                  <select value={roomForm.status} onChange={(event) => setRoomForm((current) => ({ ...current, status: event.target.value as Room["status"] }))} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <Field label="Facilities" value={roomForm.facilities} placeholder="AC, Attached Washroom, Furnished" className="md:col-span-2" hint="Separate each facility with a comma." onChange={(facilities) => setRoomForm((current) => ({ ...current, facilities }))} />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={closeRoomForm} className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="h-11 rounded-lg bg-sky-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-200 disabled:opacity-70 disabled:hover:translate-y-0">{saving ? "Saving..." : "Save Room"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
        );
      }}
    >
      <></>
    </AdminShell>
  );
}

function StatCard({ label, value, color, text }: { label: string; value: number; color: string; text: string }) {
  return (
    <div className={`rounded-xl border-l-4 border border-slate-200 p-4 ${color}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${text}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint, className = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function getPropertyId(property: Room["propertyId"]) {
  return typeof property === "string" ? property : property._id;
}

function getPropertyName(property: Room["propertyId"]) {
  return typeof property === "string" ? "Property" : property.name;
}

function getRoomId(room: Bed["roomId"]) {
  return typeof room === "string" ? room : room._id || "";
}

function formatRoomType(type: Room["roomType"]) {
  return type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function roomStatusMeta(status: Room["status"]) {
  if (status === "active") return { bg: "#E0F2FE", text: "#0369A1" };
  if (status === "maintenance") return { bg: "#DBEAFE", text: "#1D4ED8" };
  return { bg: "#F1F5F9", text: "#64748B" };
}

function bedStatusMeta(status: Bed["status"]) {
  if (status === "vacant") return { bg: "#ECFEFF", border: "#A5F3FC", text: "#0E7490" };
  if (status === "occupied") return { bg: "#EFF6FF", border: "#BFDBFE", text: "#2563EB" };
  if (status === "booked") return { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" };
  return { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626" };
}

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}

