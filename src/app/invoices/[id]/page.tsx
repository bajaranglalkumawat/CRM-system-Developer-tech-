"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Download, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  serviceName: string;
  amount: number;
  date: string;
  status: string;
  createdAt: string;
  client: { id: string; name: string; company: string | null; email: string | null; address: string | null };
  payments: { id: string; amount: number; date: string; method: string | null }[];
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

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
        body: JSON.stringify({ ...invoice, status }),
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

        <Card title="Invoice Details">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="font-mono text-sm font-medium text-card-foreground">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm text-card-foreground">{formatDate(invoice.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="text-sm text-card-foreground">{invoice.serviceName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-lg font-bold text-card-foreground">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>

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
        </Card>

        <Card title="Client Information">
          <div className="space-y-2">
            <p
              className="text-sm font-medium text-card-foreground cursor-pointer hover:text-primary"
              onClick={() => router.push(`/clients/${invoice.client.id}`)}
            >
              {invoice.client.name}
            </p>
            {invoice.client.company && (
              <p className="text-sm text-muted-foreground">{invoice.client.company}</p>
            )}
            {invoice.client.email && (
              <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
            )}
            {invoice.client.address && (
              <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
            )}
          </div>
        </Card>

        <Card title={`Payments (${invoice.payments.length})`}>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.date)} {p.method && `via ${p.method}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
