"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Edit, Trash2, Phone, Mail, Building, MapPin, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface ClientDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  address: string | null;
  projectType: string | null;
  notes: string | null;
  createdAt: string;
  projects: {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    progress: number;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    serviceName: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export default function ClientDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (res.ok) setClient(await res.json());
        else toast.error("Client not found");
      } catch {
        toast.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this client and all related data?")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Client deleted");
        router.push("/clients");
      }
    } catch {
      toast.error("Failed to delete client");
    }
  }

  const statusVariant = (status: string) => {
    const map: Record<string, "warning" | "info" | "success" | "default"> = {
      PENDING: "warning",
      WORKING: "info",
      DELIVERED: "success",
      COMPLETED: "default",
    };
    return map[status] || "default";
  };

  const invoiceStatusVariant = (status: string) => {
    const map: Record<string, "warning" | "success" | "danger"> = {
      PENDING: "warning",
      PAID: "success",
      OVERDUE: "danger",
    };
    return map[status] || "warning";
  };

  if (loading) {
    return (
      <DashboardLayout title="Client">
        <PageLoading />
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout title="Client">
        <p className="text-muted-foreground">Client not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={client.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/clients")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Client Info */}
        <Card
          title="Client Information"
          action={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.push(`/clients/${id}/edit`)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.company || "No company"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.address || "No address"}</span>
            </div>
          </div>
          {client.projectType && (
            <div className="mt-3">
              <Badge variant="info">{client.projectType}</Badge>
            </div>
          )}
          {client.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm text-card-foreground">{client.notes}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Added {formatDate(client.createdAt)}
          </p>
        </Card>

        {/* Projects */}
        <Card
          title={`Projects (${client.projects.length})`}
          action={
            <Button variant="secondary" size="sm" onClick={() => router.push("/projects/new")}>
              Add Project
            </Button>
          }
        >
          {client.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {client.projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.dueDate ? `Due: ${formatDate(p.dueDate)}` : "No due date"} &middot; {p.progress}% complete
                    </p>
                  </div>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Invoices */}
        <Card
          title={`Invoices (${client.invoices.length})`}
          action={
            <Button variant="secondary" size="sm" onClick={() => router.push("/invoices/new")}>
              Add Invoice
            </Button>
          }
        >
          {client.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {client.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {inv.invoiceNumber} - {inv.serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.date)} &middot; {formatCurrency(inv.amount)}
                    </p>
                  </div>
                  <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
