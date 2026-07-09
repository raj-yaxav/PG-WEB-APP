"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { AdminShell } from "@/components/layout/AdminShell";

interface Property {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPhone?: string;
  facilities?: string[];
  status: "active" | "inactive";
}

const emptyForm = {
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  contactPhone: "",
  facilities: "",
  status: "active" as Property["status"],
};

const STEPS = [
  { id: 1, label: "General" },
  { id: 2, label: "Location" },
  { id: 3, label: "Contact & Facilities" },
  { id: 4, label: "Settings" },
];

const FACILITY_COLORS = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-sky-50 text-sky-700 border-sky-200",
];

const CARD_TINTS = [
  { bg: "#EEF2FF", text: "#4338CA", ring: "#C7D2FE" },
  { bg: "#F0FDFA", text: "#0F766E", ring: "#99F6E4" },
  { bg: "#FFFBEB", text: "#B45309", ring: "#FDE68A" },
  { bg: "#FFF1F2", text: "#BE123C", ring: "#FECDD3" },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    window.setTimeout(() => {
      if (params.get("action") === "create") {
        openCreateForm();
      }
    }, 0);
  }, []);

  const filteredProperties = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesSearch =
        !term ||
        property.name.toLowerCase().includes(term) ||
        property.city?.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || property.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter((p) => p.status === "active").length;
    const cities = new Set(properties.map((p) => p.city).filter(Boolean)).size;
    return { total, active, inactive: total - active, cities };
  }, [properties]);

  async function fetchProperties() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/properties");
      setProperties(response.data.data || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load properties"));
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setStep(1);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(property: Property) {
    setEditingId(property._id);
    setForm({
      name: property.name,
      description: "",
      address: property.address || "",
      city: property.city || "",
      state: property.state || "",
      pincode: property.pincode || "",
      contactPhone: property.contactPhone || "",
      facilities: (property.facilities || []).join(", "),
      status: property.status,
    });
    setStep(1);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setEditingId(null);
    setForm(emptyForm);
    setStep(1);
    setShowForm(false);
  }

  function goNext() {
    if (step === 1 && !form.name.trim()) {
      setError("Property name is required");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSaveProperty() {
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Property name is required");
      setStep(1);
      return;
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      contactPhone: form.contactPhone.trim(),
      status: form.status,
      facilities: form.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);
      if (editingId) {
        const response = await api.patch(`/properties/${editingId}`, payload);
        setProperties((current) =>
          current.map((p) => (p._id === editingId ? response.data.data : p))
        );
        closeForm();
        setSuccess("Property updated successfully");
      } else {
        const response = await api.post("/properties", payload);
        setProperties((current) => [response.data.data, ...current]);
        closeForm();
        setSuccess("Property created successfully");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, editingId ? "Failed to update property" : "Failed to create property"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProperty(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/properties/${id}`);
      setProperties((current) => current.filter((p) => p._id !== id));
      setSuccess(`"${name}" deleted successfully`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete property"));
    }
  }

  return (
    <AdminShell activeItem="properties">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">Owner Workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Properties</h1>
            <p className="mt-1 text-sm text-slate-500">Create and manage PG/hostel branches.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
          >
            + Add Property
          </button>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Properties" value={stats.total} color="border-l-indigo-500 bg-indigo-50/60" text="text-indigo-700" />
          <StatCard label="Active" value={stats.active} color="border-l-green-500 bg-green-50/60" text="text-green-700" />
          <StatCard label="Inactive" value={stats.inactive} color="border-l-slate-400 bg-slate-50" text="text-slate-600" />
          <StatCard label="Cities Covered" value={stats.cities} color="border-l-amber-500 bg-amber-50/60" text="text-amber-700" />
        </div>

        {(error || success) && !showForm && (
          <div
            className={`rounded-lg border-l-4 px-4 py-3 text-sm font-medium ${
              error ? "border-l-red-500 bg-red-50 text-red-700" : "border-l-green-500 bg-green-50 text-green-700"
            }`}
          >
            {error || success}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900">Property List</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or city"
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)
            ) : filteredProperties.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
                No properties found.
              </div>
            ) : (
              filteredProperties.map((property, index) => {
                const tint = CARD_TINTS[index % CARD_TINTS.length];
                const initials = property.name.trim().slice(0, 2).toUpperCase();
                return (
                  <div
                    key={property._id}
                    className="group relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                    style={{ "--tint-ring": tint.ring } as React.CSSProperties}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = tint.ring)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                          style={{ backgroundColor: tint.bg, color: tint.text }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-800">{property.name}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{property.address || "No address added"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditForm(property)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 group-hover:opacity-100"
                          title="Edit property"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(property._id, property.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Delete property"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                            property.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {property.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-50 p-2.5 transition-colors duration-300 group-hover:bg-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                          {[property.city, property.state].filter(Boolean).join(", ") || "Not set"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 transition-colors duration-300 group-hover:bg-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{property.contactPhone || "Not set"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(property.facilities || []).slice(0, 4).map((facility, i) => (
                        <span
                          key={facility}
                          className={`rounded-full border px-2 py-1 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${FACILITY_COLORS[(index + i) % FACILITY_COLORS.length]}`}
                        >
                          {facility}
                        </span>
                      ))}
                      {(property.facilities || []).length === 0 && (
                        <span className="text-xs text-slate-400">No facilities listed</span>
                      )}
                    </div>

                    <div
                      className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                      style={{ backgroundColor: tint.text }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Multi-step Add Property Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{editingId ? "Edit Property" : "Add Property"}</h2>
                  <p className="text-xs text-slate-500">{editingId ? "Update your property details." : "Add a new PG/hostel branch to your workspace."}</p>
                </div>
              </div>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-between px-6 pt-5">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                        step === s.id
                          ? "bg-indigo-600 text-white"
                          : step > s.id
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step > s.id ? "✓" : String(s.id).padStart(2, "0")}
                    </div>
                    <span className={`text-[11px] font-semibold ${step === s.id ? "text-indigo-600" : "text-slate-400"}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-1 mt-[-14px] h-0.5 flex-1 transition-colors duration-300 ${step > s.id ? "bg-indigo-300" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step body */}
            <div className="max-h-[55vh] overflow-y-auto px-6 py-6">
              {error && <div className="mb-4 rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

              {step === 1 && (
                <div className="space-y-4">
                  <Field label="Name *" value={form.name} placeholder="Roomzy Central PG" onChange={(name) => setForm((c) => ({ ...c, name }))} hint="Give your property a short and clear name." />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
                      placeholder="Fully furnished PG with meals, WiFi, and 24x7 security."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                    <span className="mt-1.5 block text-xs text-slate-400">Give your property a short and clear description.</span>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" value={form.city} placeholder="Jaipur" onChange={(city) => setForm((c) => ({ ...c, city }))} />
                  <Field label="State" value={form.state} placeholder="Rajasthan" onChange={(state) => setForm((c) => ({ ...c, state }))} />
                  <Field label="Pincode" value={form.pincode} placeholder="302001" onChange={(pincode) => setForm((c) => ({ ...c, pincode }))} />
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
                    <textarea
                      value={form.address}
                      onChange={(event) => setForm((c) => ({ ...c, address: event.target.value }))}
                      placeholder="Full property address"
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <Field label="Contact Phone" value={form.contactPhone} placeholder="+91 98765 43210" onChange={(contactPhone) => setForm((c) => ({ ...c, contactPhone }))} />
                  <Field label="Facilities" value={form.facilities} placeholder="WiFi, CCTV, Laundry" onChange={(facilities) => setForm((c) => ({ ...c, facilities }))} hint="Separate each facility with a comma." />
                  {form.facilities.trim() && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.facilities.split(",").map((f) => f.trim()).filter(Boolean).map((facility, i) => (
                        <span key={facility} className={`rounded-full border px-2 py-1 text-xs font-semibold ${FACILITY_COLORS[i % FACILITY_COLORS.length]}`}>
                          {facility}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Property Status</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, status: "active" }))}
                      className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                        form.status === "active" ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-bold text-green-700">Active</p>
                      <p className="mt-0.5 text-xs text-slate-500">Visible and operational.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, status: "inactive" }))}
                      className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                        form.status === "inactive" ? "border-slate-400 bg-slate-100" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-600">Inactive</p>
                      <p className="mt-0.5 text-xs text-slate-500">Hidden from active listings.</p>
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Summary</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{form.name || "Untitled property"}</p>
                    <p className="text-xs text-slate-500">{[form.city, form.state].filter(Boolean).join(", ") || "Location not set"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 p-5">
              <button onClick={closeForm} className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Save as draft
              </button>
              <div className="flex gap-2">
                {step > 1 && (
                  <button onClick={goBack} className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                    Back
                  </button>
                )}
                {step < STEPS.length ? (
                  <button
                    onClick={goNext}
                    className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
                  >
                    Next step →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProperty}
                    disabled={saving}
                    className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-70"
                  >
                    {saving ? "Saving..." : editingId ? "Update Property" : "Save Property"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}
