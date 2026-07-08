"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "@/services/api";
import { getBeds } from "@/services/roomService";
import { assignBed, createTenant, deleteTenant, getTenants, markTenantLeft, updateTenant } from "@/services/tenantService";
import { AdminShell } from "@/components/layout/AdminShell";

interface Property {
  _id: string;
  name: string;
  city?: string;
}

interface Bed {
  _id: string;
  propertyId: string;
  bedNumber: string;
  status: "vacant" | "occupied" | "booked" | "maintenance";
  roomId?: { _id?: string; roomNumber?: string; floor?: string } | string;
  tenantId?: { _id?: string; name?: string; phone?: string } | string | null;
}

interface Tenant {
  _id: string;
  propertyId?: Property | string;
  roomId?: { roomNumber?: string; floor?: string } | null;
  bedId?: { bedNumber?: string; status?: string } | null;
  name: string;
  phone: string;
  email?: string;
  guardianPhone?: string;
  emergencyContact?: string;
  permanentAddress?: string;
  rentAmount: number;
  securityDeposit?: number;
  joiningDate?: string;
  status: "active" | "notice" | "left";
  kycStatus?: "pending" | "verified" | "rejected";
}

const emptyForm = {
  propertyId: "",
  name: "",
  phone: "",
  email: "",
  guardianPhone: "",
  emergencyContact: "",
  permanentAddress: "",
  rentAmount: "",
  securityDeposit: "",
  joiningDate: "",
  status: "active" as Tenant["status"],
  loginId: "",
  password: "",
  bedId: "",
};

export default function TenantsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ loginId: string; password: string } | null>(null);
  const [bedSelection, setBedSelection] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [changeBedHint, setChangeBedHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const querySearch = params.get("search");
    const shouldShowChangeBedHint = params.get("changeBed") === "1";
    window.setTimeout(() => {
      if (action === "create") {
        openCreateForm();
      }
      if (querySearch) {
        setSearch(querySearch);
      }
      if (shouldShowChangeBedHint) {
        setChangeBedHint(true);
      }
    }, 0);
  }, []);

  const filteredTenants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const tenantPropertyId = getPropertyId(tenant.propertyId);
      const matchesSearch =
        !term ||
        tenant.name.toLowerCase().includes(term) ||
        tenant.phone.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || tenant.status === statusFilter;
      const matchesProperty = !propertyFilter || tenantPropertyId === propertyFilter;
      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [tenants, search, statusFilter, propertyFilter]);

  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((t) => t.status === "active").length;
    const notice = tenants.filter((t) => t.status === "notice").length;
    const left = tenants.filter((t) => t.status === "left").length;
    return { total, active, notice, left };
  }, [tenants]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError("");
      const [propertiesRes, tenantsRes, bedsRes] = await Promise.all([
        api.get("/properties"),
        getTenants(),
        getBeds(),
      ]);
      setProperties(propertiesRes.data.data || []);
      setTenants(tenantsRes.data.data || []);
      setBeds(bedsRes.data.data || []);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to load tenants");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingTenant(null);
    setCreatedCredentials(null);
    setShowForm(false);
    setError("");
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingTenant(null);
    setCreatedCredentials(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(tenant: Tenant) {
    setEditingTenant(tenant);
    setCreatedCredentials(null);
    setError("");
    setForm({
      propertyId: getPropertyId(tenant.propertyId),
      name: tenant.name || "",
      phone: tenant.phone || "",
      email: tenant.email || "",
      guardianPhone: tenant.guardianPhone || "",
      emergencyContact: tenant.emergencyContact || "",
      permanentAddress: tenant.permanentAddress || "",
      rentAmount: String(tenant.rentAmount || ""),
      securityDeposit: String(tenant.securityDeposit || ""),
      joiningDate: tenant.joiningDate ? tenant.joiningDate.slice(0, 10) : "",
      status: tenant.status,
      loginId: "",
      password: "",
      bedId: "",
    });
    setShowForm(true);
  }

  async function handleSubmitTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedCredentials(null);

    if (!form.propertyId || !form.name.trim() || !form.phone.trim() || !form.rentAmount) {
      const message = "Property, name, phone, and rent amount are required";
      setError(message);
      toast.error(message);
      return;
    }

    const propertyBeds = beds.filter((bed) => bed.propertyId === form.propertyId);
    if (!editingTenant && propertyBeds.length === 0) {
      const message = "This property has no beds. Add rooms and beds before adding a tenant.";
      setError(message);
      toast.error(message);
      return;
    }

    const selectedBed = beds.find((bed) => bed._id === form.bedId);
    if (!editingTenant && (!selectedBed || selectedBed.status !== "vacant" || selectedBed.tenantId)) {
      const message = selectedBed?.tenantId
        ? `Bed ${selectedBed.bedNumber} is already assigned to ${getBedOccupantName(selectedBed)}`
        : "Select a vacant bed before adding a tenant.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        propertyId: form.propertyId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        guardianPhone: form.guardianPhone.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
        permanentAddress: form.permanentAddress.trim() || undefined,
        rentAmount: Number(form.rentAmount),
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
        joiningDate: form.joiningDate || undefined,
        status: form.status,
      };

      if (editingTenant) {
        const response = await updateTenant(editingTenant._id, payload);
        setTenants((current) =>
          current.map((tenant) => (tenant._id === editingTenant._id ? response.data.data : tenant))
        );
        closeForm();
        toast.success("Tenant updated successfully");
      } else {
        const response = await createTenant({
          ...payload,
          bedId: form.bedId,
          loginId: form.loginId.trim() || undefined,
          password: form.password || undefined,
        });
        const createdTenant = response.data.data.tenant || response.data.data;
        setTenants((current) => [createdTenant, ...current]);
        setCreatedCredentials(response.data.data.accountCredentials || null);
        setForm(emptyForm);
        toast.success("Tenant created successfully");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, editingTenant ? "Failed to update tenant" : "Failed to create tenant");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignBed(tenant: Tenant) {
    const bedId = bedSelection[tenant._id];
    if (!bedId) {
      const message = "Select a vacant bed first";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setError("");
      await assignBed(tenant._id, bedId);
      toast.success(`Bed assigned to ${tenant.name}`);
      await fetchInitialData();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to assign bed");
      setError(message);
      toast.error(message);
    }
  }

  async function handleRemoveAssignment(tenant: Tenant) {
    if (!tenant.bedId && !tenant.roomId) {
      const message = "Tenant has no assigned room or bed";
      setError(message);
      toast.error(message);
      return;
    }

    if (!window.confirm(`Remove room/bed assignment for ${tenant.name}?`)) return;

    try {
      setError("");
      await assignBed(tenant._id, "");
      toast.success(`Room and bed removed from ${tenant.name}`);
      await fetchInitialData();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to remove room/bed");
      setError(message);
      toast.error(message);
    }
  }

  async function handleStatusChange(tenant: Tenant, status: Tenant["status"]) {
    try {
      setError("");
      const response = await updateTenant(tenant._id, { status });
      setTenants((current) =>
        current.map((item) => (item._id === tenant._id ? response.data.data : item))
      );
      toast.success(`${tenant.name} status updated to ${status}`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update tenant status");
      setError(message);
      toast.error(message);
    }
  }

  async function handleMarkLeft(tenant: Tenant) {
    if (!window.confirm(`Mark ${tenant.name} as left?`)) return;

    try {
      setError("");
      await markTenantLeft(tenant._id);
      toast.success(`${tenant.name} marked as left`);
      await fetchInitialData();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to mark tenant as left");
      setError(message);
      toast.error(message);
    }
  }

  async function handleRestoreTenant(tenant: Tenant) {
    if (!window.confirm(`Restore ${tenant.name} to active status? This tenant has no assigned bed.`)) return;

    try {
      setError("");
      const response = await updateTenant(tenant._id, { status: "active" });
      setTenants((current) =>
        current.map((item) => (item._id === tenant._id ? response.data.data : item))
      );
      toast.success(`${tenant.name} restored to active`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to restore tenant");
      setError(message);
      toast.error(message);
    }
  }

  async function handleDeleteTenant(tenant: Tenant) {
    if (!window.confirm(`Delete ${tenant.name}? This removes the tenant record.`)) return;

    try {
      setError("");
      await deleteTenant(tenant._id);
      setTenants((current) => current.filter((item) => item._id !== tenant._id));
      toast.success(`${tenant.name} deleted`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete tenant");
      setError(message);
      toast.error(message);
    }
  }

  return (
    <AdminShell activeItem="tenants">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Residents</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Tenants</h1>
            <p className="mt-1 text-sm text-slate-500">Create tenants, allot beds, and track stay status.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="h-11 rounded-lg bg-sky-600 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-200"
          >
            + Add Tenant
          </button>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Tenants" value={stats.total} color="border-l-sky-500 bg-sky-50/70" text="text-sky-800" />
          <StatCard label="Active" value={stats.active} color="border-l-cyan-500 bg-cyan-50/70" text="text-cyan-800" />
          <StatCard label="On Notice" value={stats.notice} color="border-l-blue-500 bg-blue-50/70" text="text-blue-800" />
          <StatCard label="Left" value={stats.left} color="border-l-slate-400 bg-slate-50" text="text-slate-600" />
        </div>

        {error && !showForm && (
          <div className="rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {changeBedHint && !showForm && (
          <div className="rounded-lg border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            Select a vacant bed in the Assign Bed column, then click Assign to change this tenant&apos;s bed.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-lg font-bold text-slate-900">Tenant List</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or phone" className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
              <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                <option value="">All Properties</option>
                {properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="notice">Notice</option>
                <option value="left">Left</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Tenant</th>
                  <th className="pb-3 pr-4">Room/Bed</th>
                  <th className="pb-3 pr-4">Rent</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Assign Bed</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-6 text-sm text-slate-500" colSpan={6}>Loading tenants...</td></tr>
                ) : filteredTenants.length === 0 ? (
                  <tr><td className="py-6 text-sm text-slate-500" colSpan={6}>No tenants found.</td></tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const availableBeds = beds.filter((bed) => bed.status === "vacant" && !bed.tenantId && (!getPropertyId(tenant.propertyId) || bed.propertyId === getPropertyId(tenant.propertyId)));
                    return (
                      <tr key={tenant._id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                        <td className="py-4 pr-4">
                          <p className="text-sm font-bold text-slate-800">{tenant.name}</p>
                          <p className="text-xs text-slate-400">{tenant.phone}</p>
                          <p className="text-xs text-slate-400">{tenant.email || "No email"}</p>
                        </td>
                        <td className="py-4 pr-4 text-sm text-slate-600">
                          <p>{tenant.roomId?.roomNumber ? `Room ${tenant.roomId.roomNumber}` : "No room"}</p>
                          <p className="text-xs text-slate-400">{tenant.bedId?.bedNumber ? `Bed ${tenant.bedId.bedNumber}` : "No bed"}</p>
                        </td>
                        <td className="py-4 pr-4 text-sm font-bold text-slate-800">₹{tenant.rentAmount}</td>
                        <td className="py-4 pr-4">
                          <select
                            value={tenant.status}
                            onChange={(event) => handleStatusChange(tenant, event.target.value as Tenant["status"])}
                            className={`h-9 rounded-lg border px-2 text-xs font-bold capitalize outline-none ${tenantStatusSelectClass(tenant.status)}`}
                          >
                            <option value="active">Active</option>
                            <option value="notice">Notice</option>
                            <option value="left">Left</option>
                          </select>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex min-w-56 gap-2">
                            <select value={bedSelection[tenant._id] || ""} onChange={(event) => setBedSelection((current) => ({ ...current, [tenant._id]: event.target.value }))} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-sky-500 focus:bg-white">
                              <option value="">Select bed</option>
                              {availableBeds.map((bed) => <option key={bed._id} value={bed._id}>{getBedLabel(bed)}</option>)}
                            </select>
                            <button type="button" onClick={() => handleAssignBed(tenant)} className="h-10 rounded-lg bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-sky-600">Assign</button>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openEditForm(tenant)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                              Edit
                            </button>
                            {tenant.status !== "left" ? (
                              <button type="button" onClick={() => handleMarkLeft(tenant)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50">
                                Mark Left
                              </button>
                            ) : (
                              <button type="button" onClick={() => handleRestoreTenant(tenant)} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">
                                Restore
                              </button>
                            )}
                            {(tenant.bedId || tenant.roomId) && (
                              <button type="button" onClick={() => handleRemoveAssignment(tenant)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50">
                                Remove Room
                              </button>
                            )}
                            <button type="button" onClick={() => handleDeleteTenant(tenant)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Colorful Add Tenant modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between rounded-t-2xl bg-gradient-to-r from-sky-600 to-blue-700 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{editingTenant ? "Edit Tenant" : "Add Tenant"}</h2>
                  <p className="text-xs text-sky-100">
                    {editingTenant ? "Update resident details and rent information." : "Fill in resident details to onboard a new tenant."}
                  </p>
                </div>
              </div>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-sky-100 transition hover:bg-white/15 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitTenant} className="p-6">
              {error && <div className="mb-5 rounded-lg border-l-4 border-l-red-500 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
              {createdCredentials && (
                <div className="mb-5 rounded-lg border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <p className="font-bold">Tenant login created</p>
                  <p className="mt-1">Tenant ID: <span className="font-bold">{createdCredentials.loginId}</span></p>
                  <p>Password: <span className="font-bold">{createdCredentials.password}</span></p>
                </div>
              )}

              {/* Section: Basic Info */}
              <SectionHeading icon="user" label="Basic Information" color="text-sky-700" bg="bg-sky-50" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Property</span>
                  <select value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value, bedId: "" }))} className="h-11 w-full rounded-lg border border-sky-200 bg-sky-50/50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                    <option value="">Select property</option>
                    {properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}
                  </select>
                </label>
                {!editingTenant && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Vacant Bed</span>
                    <select
                      value={form.bedId}
                      onChange={(event) => setForm((current) => ({ ...current, bedId: event.target.value }))}
                      disabled={!form.propertyId}
                      className="h-11 w-full rounded-lg border border-sky-200 bg-sky-50/50 px-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                    >
                      <option value="">{form.propertyId ? "Select vacant bed" : "Select property first"}</option>
                      {beds.filter((bed) => bed.propertyId === form.propertyId).map((bed) => {
                        const isVacant = bed.status === "vacant" && !bed.tenantId;
                        return (
                          <option key={bed._id} value={bed._id} disabled={!isVacant}>
                            {getBedLabel(bed)}{!isVacant && bed.tenantId ? ` - assigned to ${getBedOccupantName(bed)}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {form.propertyId && beds.filter((bed) => bed.propertyId === form.propertyId).length === 0 && (
                      <p className="mt-1 text-xs font-semibold text-red-600">No beds in this property. Add beds before adding tenant.</p>
                    )}
                  </label>
                )}
                <Field label="Tenant Name" value={form.name} placeholder="Amit Sharma" tint="indigo" onChange={(name) => setForm((current) => ({ ...current, name }))} />
                <Field label="Phone" value={form.phone} placeholder="+91 98765 43210" tint="indigo" onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
                <Field label="Email" value={form.email} placeholder="tenant@example.com" type="email" tint="indigo" onChange={(email) => setForm((current) => ({ ...current, email }))} />
                {!editingTenant && (
                  <>
                    <Field label="Tenant Login ID" value={form.loginId} placeholder="Auto generates if blank" tint="indigo" onChange={(loginId) => setForm((current) => ({ ...current, loginId }))} />
                    <Field label="Tenant Password" value={form.password} placeholder="Auto generates if blank" tint="indigo" onChange={(password) => setForm((current) => ({ ...current, password }))} />
                  </>
                )}
              </div>

              {/* Section: Financial */}
              <SectionHeading icon="wallet" label="Rent & Deposit" color="text-teal-600" bg="bg-teal-50" className="mt-6" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Rent Amount" value={form.rentAmount} placeholder="7500" type="number" tint="teal" onChange={(rentAmount) => setForm((current) => ({ ...current, rentAmount }))} />
                <Field label="Security Deposit" value={form.securityDeposit} placeholder="15000" type="number" tint="teal" onChange={(securityDeposit) => setForm((current) => ({ ...current, securityDeposit }))} />
                <Field label="Joining Date" value={form.joiningDate} placeholder="" type="date" tint="teal" onChange={(joiningDate) => setForm((current) => ({ ...current, joiningDate }))} />
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Tenant["status"] }))}
                    className="h-11 w-full rounded-lg border border-teal-200 bg-teal-50/40 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="active">Active</option>
                    <option value="notice">Notice</option>
                    <option value="left">Left</option>
                  </select>
                </label>
              </div>

              {/* Section: Emergency & Address */}
              <SectionHeading icon="shield" label="Emergency & Address" color="text-blue-700" bg="bg-blue-50" className="mt-6" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Guardian Phone" value={form.guardianPhone} placeholder="+91 90000 00000" tint="amber" onChange={(guardianPhone) => setForm((current) => ({ ...current, guardianPhone }))} />
                <Field label="Emergency Contact" value={form.emergencyContact} placeholder="+91 91111 11111" tint="amber" onChange={(emergencyContact) => setForm((current) => ({ ...current, emergencyContact }))} />
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Permanent Address</span>
                  <textarea value={form.permanentAddress} onChange={(event) => setForm((current) => ({ ...current, permanentAddress: event.target.value }))} rows={3} placeholder="Tenant permanent address" className="w-full rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={closeForm} className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="h-11 rounded-lg bg-gradient-to-r from-sky-600 to-blue-700 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-200 disabled:opacity-70 disabled:hover:translate-y-0">
                  {saving ? "Saving..." : editingTenant ? "Update Tenant" : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function SectionHeading({ icon, label, color, bg, className = "" }: { icon: "user" | "wallet" | "shield"; label: string; color: string; bg: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
        <SectionIcon name={icon} />
      </span>
      <h3 className={`text-sm font-bold ${color}`}>{label}</h3>
    </div>
  );
}

function SectionIcon({ name }: { name: "user" | "wallet" | "shield" }) {
  const common = "h-4 w-4";
  if (name === "wallet") {
    return (
      <svg className={`${common} text-teal-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.75V9a3 3 0 00-3-3H5a3 3 0 00-3 3v9a3 3 0 003 3h13a3 3 0 003-3v-3.75M16.5 12h4.5m-4.5 0a1.5 1.5 0 100 3h4.5v-3h-4.5zM6 9h8" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg className={`${common} text-blue-700`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z" />
      </svg>
    );
  }
  return (
    <svg className={`${common} text-sky-700`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804" />
    </svg>
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

const TINT_CLASSES: Record<string, string> = {
  indigo: "border-sky-200 bg-sky-50/50 focus:border-sky-500 focus:ring-sky-100",
  teal: "border-teal-200 bg-teal-50/40 focus:border-teal-500 focus:ring-teal-100",
  amber: "border-blue-200 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-100",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  tint = "indigo",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  tint?: "indigo" | "teal" | "amber";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border px-3 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${TINT_CLASSES[tint]}`}
      />
    </label>
  );
}

function getPropertyId(property: Tenant["propertyId"]) {
  return typeof property === "string" ? property : property?._id || "";
}

function getBedLabel(bed: Bed) {
  const roomNumber = typeof bed.roomId === "string" ? "" : bed.roomId?.roomNumber;
  return `${roomNumber ? `Room ${roomNumber} - ` : ""}Bed ${bed.bedNumber} (${bed.status})`;
}

function getBedOccupantName(bed: Bed) {
  return typeof bed.tenantId === "object" && bed.tenantId ? bed.tenantId.name || "assigned tenant" : "assigned tenant";
}

function tenantStatusSelectClass(status: Tenant["status"]) {
  if (status === "active") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  if (status === "notice") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}

