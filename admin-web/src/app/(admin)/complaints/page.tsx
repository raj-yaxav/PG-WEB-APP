"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import { useAdminShell } from "@/components/layout/AdminShell";
import {
  createComplaint,
  createManagerReport,
  getComplaints,
  getProperties,
  getManagerReports,
  updateComplaintStatus,
  updateManagerReportStatus,
} from "@/services/complaintService";

type ComplaintStatus = "pending" | "in_progress" | "resolved";
type ReportStatus = "submitted" | "reviewed" | "closed";
type Role = "owner" | "manager" | "tenant";

interface Complaint {
  _id: string;
  tenantId?: { name?: string; phone?: string } | null;
  propertyId?: { name?: string } | null;
  roomId?: { roomNumber?: string; floor?: string } | null;
  category: string;
  title: string;
  description?: string;
  status: ComplaintStatus;
  adminNote?: string;
  createdAt: string;
}

interface ManagerReport {
  _id: string;
  managerId?: { name?: string; phone?: string; loginId?: string } | null;
  propertyId?: { name?: string; city?: string } | null;
  category: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: ReportStatus;
  ownerNote?: string;
  createdAt: string;
}

interface PropertyOption {
  _id: string;
  name: string;
  city?: string;
}

const complaintStatuses: { value: ComplaintStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const reportStatuses: { value: ReportStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "closed", label: "Closed" },
];

const complaintCategories = ["electricity", "water", "wifi", "cleaning", "food", "furniture", "other"];
const reportCategories = ["daily_update", "maintenance", "tenant_issue", "payment", "incident", "other"];

export default function ComplaintsPage() {
  const { role } = useAdminShell() as { role: Role };
  const [activeView, setActiveView] = useState<"complaints" | "reports">(() => {
    if (typeof window === "undefined") return "complaints";
    const view = new URLSearchParams(window.location.search).get("view");
    return view === "reports" && role !== "tenant" ? "reports" : "complaints";
  });
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<ManagerReport[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | ComplaintStatus>("");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { status: ComplaintStatus; adminNote: string }>>({});
  const [reportDrafts, setReportDrafts] = useState<Record<string, { status: ReportStatus; ownerNote: string }>>({});
  const [updatingId, setUpdatingId] = useState("");
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [complaintFormOpen, setComplaintFormOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category: "",
    title: "",
    description: "",
  });
  const [reportForm, setReportForm] = useState({
    title: "",
    category: "daily_update",
    priority: "medium",
    propertyId: "",
    description: "",
  });

  useEffect(() => {
    void fetchWorkspace();
  }, [statusFilter]);

  const complaintStats = useMemo(() => ({
    pending: complaints.filter((item) => item.status === "pending").length,
    inProgress: complaints.filter((item) => item.status === "in_progress").length,
    resolved: complaints.filter((item) => item.status === "resolved").length,
  }), [complaints]);

  const reportStats = useMemo(() => ({
    submitted: reports.filter((item) => item.status === "submitted").length,
    reviewed: reports.filter((item) => item.status === "reviewed").length,
    closed: reports.filter((item) => item.status === "closed").length,
  }), [reports]);

  const filteredComplaints = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return complaints;
    return complaints.filter((item) =>
      [item.title, item.category, item.tenantId?.name, item.propertyId?.name, item.roomId?.roomNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [complaints, search]);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((item) =>
      [item.title, item.category, item.managerId?.name, item.propertyId?.name, item.priority]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [reports, search]);

  async function fetchWorkspace() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const [complaintsResponse, reportsResponse, propertiesResponse] = await Promise.all([
        getComplaints(params),
        role === "tenant" ? Promise.resolve({ data: { data: [] } }) : getManagerReports({ limit: 100 }),
        role === "manager" ? getProperties({ limit: 100 }) : Promise.resolve({ data: { data: [] } }),
      ]);

      const complaintItems = complaintsResponse.data.data || [];
      const reportItems = reportsResponse.data.data || [];
      const propertyItems = propertiesResponse.data.data || [];
      setComplaints(complaintItems);
      setReports(reportItems);
      setProperties(propertyItems);
      setDrafts(
        complaintItems.reduce((acc: Record<string, { status: ComplaintStatus; adminNote: string }>, item: Complaint) => {
          acc[item._id] = { status: item.status, adminNote: item.adminNote || "" };
          return acc;
        }, {})
      );
      setReportDrafts(
        reportItems.reduce((acc: Record<string, { status: ReportStatus; ownerNote: string }>, item: ManagerReport) => {
          acc[item._id] = { status: item.status, ownerNote: item.ownerNote || "" };
          return acc;
        }, {})
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load support workspace"));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(complaint: Complaint) {
    const draft = drafts[complaint._id];
    if (!draft) return;

    try {
      setUpdatingId(complaint._id);
      await updateComplaintStatus(complaint._id, draft.status, draft.adminNote);
      toast.success("Query updated");
      await fetchWorkspace();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update query"));
    } finally {
      setUpdatingId("");
    }
  }

  async function handleComplaintCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complaintForm.category.trim() || !complaintForm.title.trim()) {
      toast.error("Category and query title are required");
      return;
    }

    try {
      await createComplaint({
        category: complaintForm.category.trim(),
        title: complaintForm.title.trim(),
        description: complaintForm.description.trim() || undefined,
      });
      toast.success("Query submitted");
      setComplaintFormOpen(false);
      setComplaintForm({ category: "", title: "", description: "" });
      await fetchWorkspace();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to submit query"));
    }
  }

  async function handleReportCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportForm.title.trim()) {
      toast.error("Report title is required");
      return;
    }

    try {
      await createManagerReport({
        ...reportForm,
        title: reportForm.title.trim(),
        propertyId: reportForm.propertyId.trim() || undefined,
        description: reportForm.description.trim() || undefined,
      });
      toast.success("Report sent to owner");
      setReportFormOpen(false);
      setReportForm({ title: "", category: "daily_update", priority: "medium", propertyId: "", description: "" });
      await fetchWorkspace();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to send report"));
    }
  }

  async function handleReportStatusUpdate(report: ManagerReport) {
    const draft = reportDrafts[report._id];
    if (!draft) return;

    try {
      setUpdatingId(report._id);
      await updateManagerReportStatus(report._id, draft.status, draft.ownerNote);
      toast.success("Report updated");
      await fetchWorkspace();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update report"));
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-blue-100 bg-[#B9D9FA] p-6 shadow-[8px_10px_28px_rgba(30,64,175,0.16)]">
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full border-[16px] border-blue-500/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Support Desk</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Tenant Queries & Manager Reports</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-700">
              Tenant queries stay in the support queue. Manager reports go directly to the owner for review.
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tenant, manager, room, title..."
            className="h-12 w-full rounded-xl border border-white/80 bg-white/85 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200 lg:w-96"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-blue-100">
          <TabButton active={activeView === "complaints"} label="Tenant Queries" onClick={() => setActiveView("complaints")} />
          {role !== "tenant" ? (
            <TabButton active={activeView === "reports"} label="Manager Reports" onClick={() => setActiveView("reports")} />
          ) : null}
        </div>
        {role === "tenant" && activeView === "complaints" ? (
          <button
            type="button"
            onClick={() => setComplaintFormOpen((value) => !value)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          >
            {complaintFormOpen ? "Close Form" : "Raise Query"}
          </button>
        ) : null}
        {role === "manager" && activeView === "reports" ? (
          <button
            type="button"
            onClick={() => setReportFormOpen((value) => !value)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          >
            {reportFormOpen ? "Close Form" : "Send Report"}
          </button>
        ) : null}
      </div>

      {activeView === "complaints" ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Pending" value={complaintStats.pending} color="border-blue-200 bg-blue-50 text-blue-800" />
            <StatCard label="In Progress" value={complaintStats.inProgress} color="border-blue-200 bg-blue-50 text-blue-700" />
            <StatCard label="Resolved" value={complaintStats.resolved} color="border-sky-200 bg-sky-50 text-sky-700" />
          </div>
          {role === "tenant" && complaintFormOpen ? (
            <ComplaintForm form={complaintForm} setForm={setComplaintForm} onSubmit={handleComplaintCreate} />
          ) : null}
          <ComplaintTable
            complaints={filteredComplaints}
            drafts={drafts}
            loading={loading}
            statusFilter={statusFilter}
            updatingId={updatingId}
            onFilter={setStatusFilter}
            onDraft={(id, patch) => setDrafts((current) => ({ ...current, [id]: { status: current[id]?.status || "pending", adminNote: current[id]?.adminNote || "", ...patch } }))}
            onUpdate={handleStatusUpdate}
            role={role}
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Submitted" value={reportStats.submitted} color="border-blue-200 bg-blue-50 text-blue-700" />
            <StatCard label="Reviewed" value={reportStats.reviewed} color="border-blue-200 bg-blue-50 text-blue-700" />
            <StatCard label="Closed" value={reportStats.closed} color="border-slate-200 bg-slate-50 text-slate-700" />
          </div>
          {role === "manager" && reportFormOpen ? (
            <ReportForm form={reportForm} setForm={setReportForm} properties={properties} onSubmit={handleReportCreate} />
          ) : null}
          <ReportTable
            reports={filteredReports}
            drafts={reportDrafts}
            loading={loading}
            role={role}
            updatingId={updatingId}
            onDraft={(id, patch) => setReportDrafts((current) => ({ ...current, [id]: { status: current[id]?.status || "submitted", ownerNote: current[id]?.ownerNote || "", ...patch } }))}
            onUpdate={handleReportStatusUpdate}
          />
        </>
      )}
    </div>
  );
}

function ComplaintTable({ complaints, drafts, loading, statusFilter, updatingId, onFilter, onDraft, onUpdate, role }: {
  complaints: Complaint[];
  drafts: Record<string, { status: ComplaintStatus; adminNote: string }>;
  loading: boolean;
  statusFilter: "" | ComplaintStatus;
  updatingId: string;
  onFilter: (status: "" | ComplaintStatus) => void;
  onDraft: (id: string, patch: Partial<{ status: ComplaintStatus; adminNote: string }>) => void;
  onUpdate: (complaint: Complaint) => void;
  role: Role;
}) {
  const canUpdate = role === "owner" || role === "manager";

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[8px_10px_24px_rgba(30,64,175,0.08)]">
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterButton active={statusFilter === ""} label="All" onClick={() => onFilter("")} />
        {complaintStatuses.map((status) => (
          <FilterButton key={status.value} active={statusFilter === status.value} label={status.label} onClick={() => onFilter(status.value)} />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="pb-3 pr-4">Tenant</th>
              <th className="pb-3 pr-4">Query</th>
              <th className="pb-3 pr-4">Property / Room</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Admin Note</th>
              {canUpdate ? <th className="pb-3 text-right">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-6 text-sm text-slate-500" colSpan={canUpdate ? 6 : 5}>Loading queries...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td className="py-6 text-sm text-slate-500" colSpan={canUpdate ? 6 : 5}>No tenant queries found.</td></tr>
            ) : complaints.map((complaint) => {
              const draft = drafts[complaint._id] || { status: complaint.status, adminNote: complaint.adminNote || "" };
              return (
                <tr key={complaint._id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-800">{complaint.tenantId?.name || "Unknown tenant"}</p>
                    <p className="text-xs text-slate-400">{complaint.tenantId?.phone || "No phone"}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(complaint.createdAt)}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-700">{labelize(complaint.category)}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{complaint.title}</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">{complaint.description || "No description added."}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-semibold text-slate-700">{complaint.propertyId?.name || "Property"}</p>
                    <p className="text-xs text-slate-400">{complaint.roomId?.roomNumber ? `Room ${complaint.roomId.roomNumber}` : "No room"}</p>
                  </td>
                  <td className="py-4 pr-4">
                    {canUpdate ? (
                      <select value={draft.status} onChange={(event) => onDraft(complaint._id, { status: event.target.value as ComplaintStatus })} className={`h-10 rounded-lg border px-3 text-sm font-bold outline-none ${statusClass(draft.status)}`}>
                        {complaintStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusPill(complaint.status)}`}>{labelize(complaint.status)}</span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    {canUpdate ? (
                      <textarea value={draft.adminNote} onChange={(event) => onDraft(complaint._id, { adminNote: event.target.value })} rows={2} placeholder="Add update note" className="w-72 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                    ) : (
                      <p className="max-w-xs text-sm text-slate-500">{complaint.adminNote || "Waiting for property team update"}</p>
                    )}
                  </td>
                  {canUpdate ? (
                    <td className="py-4 text-right">
                      <button type="button" onClick={() => onUpdate(complaint)} disabled={updatingId === complaint._id} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">
                        {updatingId === complaint._id ? "Saving..." : "Update"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComplaintForm({ form, setForm, onSubmit }: {
  form: { category: string; title: string; description: string };
  setForm: (form: { category: string; title: string; description: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const set = (field: keyof typeof form, value: string) => setForm({ ...form, [field]: value });
  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-blue-100 bg-[#E2F0FF] p-5 shadow-[8px_10px_24px_rgba(30,64,175,0.08)] lg:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">
        Category
        <select value={form.category} onChange={(event) => set("category", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          <option value="">Select category</option>
          {complaintCategories.map((category) => <option key={category} value={category}>{labelize(category)}</option>)}
        </select>
      </label>
      <Field label="Query title" value={form.title} onChange={(value) => set("title", value)} placeholder="Short query title" />
      <label className="text-sm font-bold text-slate-700 lg:col-span-2">
        Description
        <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Explain the issue clearly" className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
      </label>
      <div className="lg:col-span-2">
        <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">Submit Query</button>
      </div>
    </form>
  );
}

function ReportForm({ form, setForm, properties, onSubmit }: {
  form: { title: string; category: string; priority: string; propertyId: string; description: string };
  setForm: (form: { title: string; category: string; priority: string; propertyId: string; description: string }) => void;
  properties: PropertyOption[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const set = (field: keyof typeof form, value: string) => setForm({ ...form, [field]: value });
  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-blue-100 bg-[#E2F0FF] p-5 shadow-[8px_10px_24px_rgba(30,64,175,0.08)] lg:grid-cols-2">
      <Field label="Report title" value={form.title} onChange={(value) => set("title", value)} placeholder="Daily maintenance update" />
      <label className="text-sm font-bold text-slate-700">
        Property
        <select value={form.propertyId} onChange={(event) => set("propertyId", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          <option value="">No property selected</option>
          {properties.map((property) => (
            <option key={property._id} value={property._id}>
              {property.name}{property.city ? ` - ${property.city}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-slate-700">
        Category
        <select value={form.category} onChange={(event) => set("category", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          {reportCategories.map((category) => <option key={category} value={category}>{labelize(category)}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold text-slate-700">
        Priority
        <select value={form.priority} onChange={(event) => set("priority", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          {["low", "medium", "high", "urgent"].map((priority) => <option key={priority} value={priority}>{labelize(priority)}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold text-slate-700 lg:col-span-2">
        Description
        <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Write the report details for the owner" className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
      </label>
      <div className="lg:col-span-2">
        <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">Send to Owner</button>
      </div>
    </form>
  );
}

function ReportTable({ reports, drafts, loading, role, updatingId, onDraft, onUpdate }: {
  reports: ManagerReport[];
  drafts: Record<string, { status: ReportStatus; ownerNote: string }>;
  loading: boolean;
  role: Role;
  updatingId: string;
  onDraft: (id: string, patch: Partial<{ status: ReportStatus; ownerNote: string }>) => void;
  onUpdate: (report: ManagerReport) => void;
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[8px_10px_24px_rgba(30,64,175,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="pb-3 pr-4">Manager</th>
              <th className="pb-3 pr-4">Report</th>
              <th className="pb-3 pr-4">Priority</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Owner Note</th>
              {role === "owner" ? <th className="pb-3 text-right">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-6 text-sm text-slate-500" colSpan={role === "owner" ? 6 : 5}>Loading reports...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td className="py-6 text-sm text-slate-500" colSpan={role === "owner" ? 6 : 5}>No manager reports yet.</td></tr>
            ) : reports.map((report) => {
              const draft = drafts[report._id] || { status: report.status, ownerNote: report.ownerNote || "" };
              return (
                <tr key={report._id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-800">{report.managerId?.name || "Manager"}</p>
                    <p className="text-xs text-slate-400">{report.managerId?.phone || report.managerId?.loginId || "No contact"}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(report.createdAt)}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-700">{labelize(report.category)}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{report.title}</p>
                    <p className="mt-1 max-w-sm text-xs text-slate-500">{report.description || "No description added."}</p>
                    <p className="mt-2 text-xs text-slate-400">{report.propertyId?.name || "No property selected"}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${priorityClass(report.priority)}`}>{labelize(report.priority)}</span>
                  </td>
                  <td className="py-4 pr-4">
                    {role === "owner" ? (
                      <select value={draft.status} onChange={(event) => onDraft(report._id, { status: event.target.value as ReportStatus })} className={`h-10 rounded-lg border px-3 text-sm font-bold outline-none ${reportStatusClass(draft.status)}`}>
                        {reportStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${reportStatusPill(report.status)}`}>{labelize(report.status)}</span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    {role === "owner" ? (
                      <textarea value={draft.ownerNote} onChange={(event) => onDraft(report._id, { ownerNote: event.target.value })} rows={2} placeholder="Owner note" className="w-72 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                    ) : (
                      <p className="max-w-xs text-sm text-slate-500">{report.ownerNote || "Waiting for owner review"}</p>
                    )}
                  </td>
                  {role === "owner" ? (
                    <td className="py-4 text-right">
                      <button type="button" onClick={() => onUpdate(report)} disabled={updatingId === report._id} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">
                        {updatingId === report._id ? "Saving..." : "Update"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="text-sm font-bold text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
    </label>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${active ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"}`}>
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-[8px_10px_24px_rgba(30,64,175,0.06)] ${color}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${active ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-blue-50 text-slate-600 hover:bg-blue-100"}`}>
      {label}
    </button>
  );
}

function statusClass(status: ComplaintStatus) {
  if (status === "pending") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "in_progress") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-cyan-200 bg-cyan-50 text-cyan-800";
}

function statusPill(status: ComplaintStatus) {
  if (status === "pending") return "bg-blue-50 text-blue-800";
  if (status === "in_progress") return "bg-blue-50 text-blue-700";
  return "bg-cyan-50 text-cyan-800";
}

function reportStatusClass(status: ReportStatus) {
  if (status === "submitted") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "reviewed") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function reportStatusPill(status: ReportStatus) {
  if (status === "submitted") return "bg-sky-50 text-sky-800";
  if (status === "reviewed") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

function priorityClass(priority: ManagerReport["priority"]) {
  if (priority === "urgent") return "bg-red-50 text-red-700";
  if (priority === "high") return "bg-blue-50 text-blue-800";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-700";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function labelize(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}
