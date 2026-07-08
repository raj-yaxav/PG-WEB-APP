"use client";

/**
 * app/payments/page.tsx — Rent & Payments Management Page
 *
 * ─────────────────────────────────────────────────────
 * UI TODO (Design to be implemented later):
 * ─────────────────────────────────────────────────────
 * Layout:
 *   - Page header: "Rent & Payments"
 *   - Tab bar: [Invoices] [Payment History]
 *
 * ── INVOICES TAB ──────────────────────────────────────
 *
 * Action Bar:
 *   - "+ Create Invoice" button (top right)
 *   - Filters:
 *       Property dropdown
 *       Month picker
 *       Year picker
 *       Status filter: All | Unpaid | Partially Paid | Paid
 *
 * Invoice Table:
 *   Columns:
 *     Tenant Name | Phone | Month/Year | Rent | Extra | Discount | Total | Due Date | Status | Actions
 *
 *   Row details:
 *     - Status badges:
 *         paid = green
 *         partially_paid = yellow
 *         unpaid = red
 *     - Actions:
 *         [Mark Paid] button (if unpaid/partial)
 *         [Add Payment] button → opens payment modal
 *         [Payment Link] icon (if link available)
 *         [View] [Edit] [Delete]
 *
 * Create Invoice Form (Modal):
 *   Fields:
 *     - Tenant* (search/dropdown)
 *     - Month* (dropdown: Jan–Dec)
 *     - Year* (number input)
 *     - Rent Amount* (₹, pre-filled from tenant)
 *     - Extra Charges (₹)
 *     - Discount (₹)
 *     - Total Amount (auto-calculated, read-only)
 *     - Due Date (date picker)
 *     - Razorpay Payment Link (text input, paste manually)
 *   Buttons: [Cancel] [Create Invoice]
 *
 * Add Payment Modal:
 *   Fields:
 *     - Amount* (₹)
 *     - Payment Mode* (Cash / UPI / Bank Transfer / Razorpay Link)
 *     - Payment Date (date picker, default: today)
 *     - Transaction Ref (text)
 *     - Notes (textarea)
 *   Buttons: [Cancel] [Record Payment]
 *
 * ── PAYMENT HISTORY TAB ──────────────────────────────
 *
 * Payment Table:
 *   Columns:
 *     Tenant | Month/Year | Amount | Payment Mode | Date | Transaction Ref | Notes
 *   Filters: Tenant, Property, Invoice
 *
 * ─────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getInvoices, getPayments } from "@/services/invoiceService";
import { AdminShell } from "@/components/layout/AdminShell";

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === "invoices") {
          const res = await getInvoices();
          setInvoices(res.data.data || []);
        } else {
          const res = await getPayments();
          setPayments(res.data.data || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <AdminShell activeItem="payments">
    <div>
      {/*
        UI PLACEHOLDER — Design will be implemented later.
        See comments above for full UI specification.
      */}
      <h1>Rent & Payments</h1>

      {/* Tab Navigation */}
      <div>
        <button onClick={() => setActiveTab("invoices")}>Invoices</button>
        <button onClick={() => setActiveTab("payments")}>Payment History</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {activeTab === "invoices" && (
        <div>
          <h2>Invoices</h2>
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Month</th>
                <th>Year</th>
                <th>Total</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.tenantId?.name || "—"}</td>
                  <td>{inv.month}</td>
                  <td>{inv.year}</td>
                  <td>₹{inv.totalAmount}</td>
                  <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                  <td>{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "payments" && (
        <div>
          <h2>Payment History</h2>
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Date</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay._id}>
                  <td>{pay.tenantId?.name || "—"}</td>
                  <td>₹{pay.amount}</td>
                  <td>{pay.paymentMode}</td>
                  <td>{new Date(pay.paymentDate).toLocaleDateString()}</td>
                  <td>{pay.transactionRef || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p>Rent & Payments UI will be designed later.</p>
    </div>
    </AdminShell>
  );
}

