"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, IndianRupee, Clock, TrendingUp } from "lucide-react";

interface CategoryRevenue {
  name: string;
  revenue: number;
}

interface TopService {
  name: string;
  revenue: number;
}

interface PendingPayment {
  id: string;
  invoiceNumber: string;
  clientName: string;
  company: string | null;
  amount: number;
  date: string;
}

interface ReportData {
  categoryRevenue: CategoryRevenue[];
  topServices: TopService[];
  monthlyIncome: Record<string, number>;
  pendingPayments: PendingPayment[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) setData(await res.json());
      } catch {
        console.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Reports">
        <PageLoading />
      </DashboardLayout>
    );
  }

  const totalCategoryRevenue = data?.categoryRevenue.reduce((s, c) => s + c.revenue, 0) || 0;
  const totalPending = data?.pendingPayments.reduce((s, p) => s + p.amount, 0) || 0;
  const totalMonthlyIncome = Object.values(data?.monthlyIncome || {}).reduce((s, v) => s + v, 0);

  const maxCatRevenue = Math.max(...(data?.categoryRevenue.map((c) => c.revenue) || [1]), 1);
  const maxMonthlyIncome = Math.max(...Object.values(data?.monthlyIncome || {}), 1);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(totalCategoryRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected (12 Months)</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(totalMonthlyIncome)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Payments</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category-wise Revenue */}
        <Card title="Category-wise Revenue">
          {data?.categoryRevenue.length ? (
            <div className="space-y-3">
              {data.categoryRevenue.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-card-foreground">{cat.name}</span>
                    <span className="text-sm font-semibold text-card-foreground">{formatCurrency(cat.revenue)}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${(cat.revenue / maxCatRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No revenue data yet.</p>
          )}
        </Card>

        {/* Monthly Income */}
        <Card title="Monthly Income (Last 12 Months)">
          {Object.keys(data?.monthlyIncome || {}).length ? (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-40">
                {Object.entries(data?.monthlyIncome || {}).map(([month, amount]) => {
                  const height = (amount / maxMonthlyIncome) * 100;
                  return (
                    <div key={month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{formatCurrency(amount)}</span>
                      <div
                        className="w-full rounded-t bg-primary transition-all min-h-[4px]"
                        style={{ height: `${height}%` }}
                        title={`${month}: ${formatCurrency(amount)}`}
                      />
                      <span className="text-[10px] text-muted-foreground rotate-[-45deg]">{month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No monthly income data yet.</p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Services */}
          <Card title="Top Services by Revenue">
            {data?.topServices.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Service</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.topServices.map((svc, idx) => (
                      <tr key={svc.name}>
                        <td className="py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 font-medium text-card-foreground">{svc.name}</td>
                        <td className="py-2 text-right font-semibold text-card-foreground">{formatCurrency(svc.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No service data yet.</p>
            )}
          </Card>

          {/* Pending Payments */}
          <Card title={`Pending Payments (${data?.pendingPayments.length || 0})`}>
            {data?.pendingPayments.length ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.pendingPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{p.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.invoiceNumber} &middot; {formatDate(p.date)}
                      </p>
                    </div>
                    <Badge variant="warning">{formatCurrency(p.amount)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending payments.</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
