"use client";

/**
 * app/reports/page.tsx — Reports Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Reports"
 *   - Tab navigation for different report types
 *
 * Report Tabs:
 *
 *   1. Tenant List
 *      - Table: Name | Phone | Room | Bed | Rent | Status | Joining Date
 *      - Filters: Property, Status
 *      - [Export to PDF] [Export to Excel] buttons — placeholder only in V1
 *
 *   2. Pending Dues
 *      - Table: Tenant | Month | Year | Total Amount | Paid | Pending
 *      - Filter: Property, Month, Year
 *      - Grand total row at bottom
 *
 *   3. Rent Collection
 *      - Table: Tenant | Month | Year | Invoice Total | Collected | Mode | Date
 *      - Filter: Property, Month, Year, Payment Mode
 *      - Total collected at bottom
 *
 *   4. Vacant Beds
 *      - Table: Property | Room Number | Floor | Bed Number | Bed Status
 *      - Filter: Property
 *      - Count of vacant beds at top
 *
 *   5. Complaints Summary
 *      - Table: Category | Pending | In Progress | Resolved | Total
 *      - Filter: Property, Date Range
 *      - Category-wise breakdown
 *
 * Export Buttons (V1 — disabled/placeholder):
 *   - [Export PDF] — greyed out with tooltip "Coming soon"
 *   - [Export Excel] — greyed out with tooltip "Coming soon"
 *
 * NOTE: No complex charts in V1. Simple tables only.
 * Charts can be added in V2 using Chart.js or Recharts.
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getTenants } from "@/services/tenantService";
import { getInvoices } from "@/services/invoiceService";
import { getBeds } from "@/services/roomService";
import { getComplaints } from "@/services/complaintService";

type ReportTab = "tenants" | "pending-dues" | "rent-collection" | "vacant-beds" | "complaints";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("tenants");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "tenants", label: "Tenant List" },
    { id: "pending-dues", label: "Pending Dues" },
    { id: "rent-collection", label: "Rent Collection" },
    { id: "vacant-beds", label: "Vacant Beds" },
    { id: "complaints", label: "Complaints" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        let res;
        switch (activeTab) {
          case "tenants":
            res = await getTenants({ limit: 100 });
            break;
          case "pending-dues":
            res = await getInvoices({ status: "unpaid", limit: 100 });
            break;
          case "rent-collection":
            res = await getInvoices({ status: "paid", limit: 100 });
            break;
          case "vacant-beds":
            res = await getBeds({ status: "vacant", limit: 100 });
            break;
          case "complaints":
            res = await getComplaints({ limit: 100 });
            break;
        }
        setData(res?.data?.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Reports</h1>

      {/* Tab Navigation */}
      <div>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading report...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        <p>Active Report: {tabs.find((t) => t.id === activeTab)?.label}</p>
        <p>Records found: {data.length}</p>
        {/* TODO: Render proper table based on activeTab */}
      </div>

      <div>
        {/* Export buttons — disabled in V1 */}
        <button disabled title="Coming soon">Export PDF</button>
        <button disabled title="Coming soon">Export Excel</button>
      </div>

      <p>Reports UI will be designed later.</p>
    </div>
  );
}
