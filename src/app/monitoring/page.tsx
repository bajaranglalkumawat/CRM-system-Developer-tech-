"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MonitorForm } from "@/components/monitoring/MonitorForm";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatDateTime } from "@/lib/utils";
import { RefreshCw, Trash2, Globe, Wifi, WifiOff } from "lucide-react";
import toast from "react-hot-toast";

interface Monitor {
  id: string;
  url: string;
  status: string;
  statusCode: number | null;
  lastChecked: string | null;
  responseTime: number | null;
  createdAt: string;
}

export default function MonitoringPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchMonitors();
  }, []);

  async function fetchMonitors() {
    try {
      const res = await fetch("/api/monitoring");
      if (res.ok) setMonitors(await res.json());
    } catch {
      toast.error("Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(data: { url: string }) {
    const res = await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("URL added and checked");
      fetchMonitors();
    } else {
      toast.error("Failed to add URL");
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      const res = await fetch("/api/monitoring/check", { method: "POST" });
      if (res.ok) {
        toast.success("All URLs checked");
        fetchMonitors();
      }
    } catch {
      toast.error("Check failed");
    } finally {
      setChecking(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this URL?")) return;
    try {
      const res = await fetch(`/api/monitoring/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Monitor removed");
        fetchMonitors();
      }
    } catch {
      toast.error("Failed to remove");
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Monitoring">
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Monitoring">
      <div className="space-y-6">
        <Card title="Add URL to Monitor">
          <MonitorForm onSubmit={handleAdd} />
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {monitors.length} URLs monitored
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCheck}
            loading={checking}
          >
            <RefreshCw className="h-4 w-4" />
            Check All
          </Button>
        </div>

        {monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <Globe className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No URLs being monitored. Add one above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {monitors.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  {m.status === "UP" ? (
                    <Wifi className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {m.url}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge
                        variant={m.status === "UP" ? "success" : "danger"}
                      >
                        {m.status}
                        {m.statusCode && ` (${m.statusCode})`}
                      </Badge>
                      {m.responseTime && (
                        <span>{m.responseTime}ms</span>
                      )}
                      {m.lastChecked && (
                        <span>Checked: {formatDateTime(m.lastChecked)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
