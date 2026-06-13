"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { Plus, Download, Trash2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  serviceName: string | null;
  amount: number | null;
  totalAmount: number;
  date: string;
  status: string;
  client: { id: string; name: string };
  items: { id: string; serviceName: string; amount: number }[];
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) setInvoices(await res.json());
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice deleted");
        fetchInvoices();
      }
    } catch {
      toast.error("Failed to delete invoice");
    }
  }

  function handleDownload(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    window.open(`/api/invoices/${id}/pdf`, "_blank");
  }

  const statusVariant = (s: string): "warning" | "success" | "danger" => {
    const map: Record<string, "warning" | "success" | "danger"> = {
      PENDING: "warning", PAID: "success", OVERDUE: "danger",
    };
    return map[s] || "warning";
  };

  if (loading) {
    return <DashboardLayout title="Invoices"><PageLoading /></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Invoices">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
          <Button onClick={() => router.push("/invoices/new")}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-card-foreground">{inv.serviceName || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.client.name}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{formatCurrency(inv.totalAmount || inv.amount || 0)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(inv.status)}>{inv.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleDownload(inv.id, e)}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(inv.id, e)}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
