"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, FolderKanban, IndianRupee, Clock } from "lucide-react";

interface DashboardData {
  totalClients: number;
  activeProjects: number;
  totalRevenue: number;
  pendingPayments: number;
  recentActivity: {
    id: string;
    type: string;
    action: string;
    name: string;
    date: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Clients"
            value={data?.totalClients ?? 0}
            icon={Users}
          />
          <StatsCard
            title="Active Projects"
            value={data?.activeProjects ?? 0}
            icon={FolderKanban}
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(data?.totalRevenue ?? 0)}
            icon={IndianRupee}
          />
          <StatsCard
            title="Pending Payments"
            value={formatCurrency(data?.pendingPayments ?? 0)}
            icon={Clock}
          />
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">
            Recent Activity
          </h3>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recent activity. Start by adding clients, projects, or invoices.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
