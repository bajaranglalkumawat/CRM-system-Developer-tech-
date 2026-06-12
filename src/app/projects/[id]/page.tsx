"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  createdAt: string;
  client: { id: string; name: string; company: string | null; email: string | null; phone: string | null };
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          setStatus(data.status);
          setProgress(data.progress);
        }
      } catch {
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...project,
          status,
          progress,
        }),
      });
      if (res.ok) {
        toast.success("Project updated");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Project deleted");
        router.push("/projects");
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

  if (loading) {
    return <DashboardLayout title="Project"><PageLoading /></DashboardLayout>;
  }

  if (!project) {
    return <DashboardLayout title="Project"><p className="text-muted-foreground">Project not found.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title={project.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card title="Project Details">
          <div className="space-y-4">
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p
                  className="text-sm font-medium text-card-foreground cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/clients/${project.client.id}`)}
                >
                  {project.client.name}
                  {project.client.company && ` - ${project.client.company}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm text-card-foreground">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm text-card-foreground">
                  {project.dueDate ? formatDate(project.dueDate) : "No due date"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Status & Progress">
          <div className="space-y-4">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "WORKING", label: "Working" },
                { value: "DELIVERED", label: "Delivered" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />
            <Badge variant={statusVariant(status)}>{status}</Badge>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-card-foreground">
                Progress: {progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
