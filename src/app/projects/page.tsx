"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string | null;
  createdAt: string;
  client: { id: string; name: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  async function fetchProjects() {
    try {
      const url = statusFilter
        ? `/api/projects?status=${statusFilter}`
        : "/api/projects";
      const res = await fetch(url);
      if (res.ok) setProjects(await res.json());
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Project deleted");
        fetchProjects();
      }
    } catch {
      toast.error("Failed to delete project");
    }
  }

  const statusVariant = (s: string): "warning" | "info" | "success" | "default" => {
    const map: Record<string, "warning" | "info" | "success" | "default"> = {
      PENDING: "warning", WORKING: "info", DELIVERED: "success", COMPLETED: "default",
    };
    return map[s] || "default";
  };

  const tabs = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Working", value: "WORKING" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Completed", value: "COMPLETED" },
  ];

  if (loading) {
    return <DashboardLayout title="Projects"><PageLoading /></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Projects">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">No projects found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Progress</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Due Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/projects/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-card-foreground">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.client.name}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {p.dueDate ? formatDate(p.dueDate) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
