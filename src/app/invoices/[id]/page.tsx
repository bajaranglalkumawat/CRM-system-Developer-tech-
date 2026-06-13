"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Download, Trash2, Save, Plus, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

interface InvoiceItem {
  id: string;
  serviceName: string;
  categoryName: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  amount: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  serviceName: string | null;
  amount: number | null;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  date: string;
  dueDate: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  client: { id: string; name: string; company: string | null; email: string | null; phone: string | null; address: string | null };
  items: InvoiceItem[];
  payments: { id: string; amount: number; date: string; method: string | null }[];
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // Payment modal state
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0], method: "UPI" });
  const [paySaving, setPaySaving] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
          setStatus(data.status);
        }
      } catch {
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Invoice updated");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update invoice");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice deleted");
        router.push("/invoices");
      }
    } catch {
      toast.error("Failed to delete invoice");
    }
  }

  function handleDownload() {
    window.open(`/api/invoices/${id}/pdf`, "_blank");
  }

  const statusVariant = (s: string): "warning" | "success" | "danger" => {
    const map: Record<string, "warning" | "success" | "danger"> = {
      PENDING: "warning", PAID: "success", OVERDUE: "danger",
    };
    return map[s] || "warning";
  };

  if (loading) {
    return <DashboardLayout title="Invoice"><PageLoading /></DashboardLayout>;
  }

  if (!invoice) {
    return <DashboardLayout title="Invoice"><p className="text-muted-foreground">Invoice not found.</p></DashboardLayout>;
  }

  const hasItems = invoice.items && invoice.items.length > 0;

  return (
    <DashboardLayout title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/invoices")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <Card title="Invoice Details">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="font-mono text-sm font-medium text-card-foreground">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm text-card-foreground">{formatDate(invoice.date)}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm text-card-foreground">{formatDate(invoice.dueDate)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold text-card-foreground">{formatCurrency(invoice.totalAmount || invoice.amount || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                label="Payment Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "PAID", label: "Paid" },
                  { value: "OVERDUE", label: "Overdue" },
                ]}
              />
              <Badge variant={statusVariant(status)}>{status}</Badge>
            </div>
          </div>
        </Card>

        {/* Items Table */}
        {hasItems && (
          <Card title="Services">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rate</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Disc%</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">GST%</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium text-card-foreground">{item.serviceName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{item.categoryName || "-"}</td>
                      <td className="px-3 py-2 text-center text-card-foreground">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-card-foreground">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{item.discount}%</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{item.taxPercent}%</td>
                      <td className="px-3 py-2 text-right font-medium text-card-foreground">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-card-foreground">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST</span>
                  <span className="font-medium text-card-foreground">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-card-foreground">Grand Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card title="Notes">
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </Card>
        )}

        {/* Client Info */}
        <Card title="Client Information">
          <div className="space-y-2">
            <p
              className="text-sm font-medium text-card-foreground cursor-pointer hover:text-primary"
              onClick={() => router.push(`/clients/${invoice.client.id}`)}
            >
              {invoice.client.name}
            </p>
            {invoice.client.company && <p className="text-sm text-muted-foreground">{invoice.client.company}</p>}
            {invoice.client.email && <p className="text-sm text-muted-foreground">{invoice.client.email}</p>}
            {invoice.client.address && <p className="text-sm text-muted-foreground">{invoice.client.address}</p>}
          </div>
        </Card>

        {/* Payments */}
        <Card title={`Payments (${invoice.payments.length})`}>
          {/* Payment summary */}
          {(() => {
            const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            const invoiceTotal = invoice.totalAmount || invoice.amount || 0;
            const remaining = invoiceTotal - totalPaid;
            return (
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Invoice Total</p>
                  <p className="text-lg font-bold text-card-foreground">{formatCurrency(invoiceTotal)}</p>
                </div>
                <div className="rounded-lg border border-border bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className={`rounded-lg border border-border p-3 text-center ${remaining > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={`text-lg font-bold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatCurrency(Math.max(remaining, 0))}</p>
                </div>
              </div>
            );
          })()}

          {/* Payment list */}
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.date)} {p.method && `via ${p.method}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this payment?")) return;
                      try {
                        const res = await fetch(`/api/invoices/${id}/payments?paymentId=${p.id}`, { method: "DELETE" });
                        if (res.ok) {
                          toast.success("Payment deleted");
                          // Refresh
                          const refreshRes = await fetch(`/api/invoices/${id}`);
                          if (refreshRes.ok) {
                            const data = await refreshRes.json();
                            setInvoice(data);
                            setStatus(data.status);
                          }
                        }
                      } catch {
                        toast.error("Failed to delete payment");
                      }
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Payment Button */}
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
              const invoiceTotal = invoice.totalAmount || invoice.amount || 0;
              const remaining = Math.max(invoiceTotal - totalPaid, 0);
              setPayForm({ amount: remaining.toString(), date: new Date().toISOString().split("T")[0], method: "UPI" });
              setPayModal(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Payment
          </Button>
        </Card>

        {/* Add Payment Modal */}
        <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Add Payment">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPaySaving(true);
              try {
                const res = await fetch(`/api/invoices/${id}/payments`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payForm),
                });
                if (res.ok) {
                  toast.success("Payment added");
                  setPayModal(false);
                  // Refresh invoice
                  const refreshRes = await fetch(`/api/invoices/${id}`);
                  if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setInvoice(data);
                    setStatus(data.status);
                  }
                } else {
                  toast.error("Failed to add payment");
                }
              } catch {
                toast.error("Failed to add payment");
              } finally {
                setPaySaving(false);
              }
            }}
            className="space-y-4"
          >
            <Input
              label="Amount (INR) *"
              type="number"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              required
              min="1"
              step="0.01"
              placeholder="0.00"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Date"
                type="date"
                value={payForm.date}
                onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
              />
              <Select
                label="Payment Method"
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                options={[
                  { value: "UPI", label: "UPI" },
                  { value: "Bank Transfer", label: "Bank Transfer (NEFT/RTGS)" },
                  { value: "Cash", label: "Cash" },
                  { value: "Cheque", label: "Cheque" },
                  { value: "Card", label: "Card" },
                ]}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button>
              <Button type="submit" loading={paySaving}>Add Payment</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
