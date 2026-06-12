"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  projectType: string | null;
  createdAt: string;
  _count: { projects: number; invoices: number };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients();
  }, [search]);

  async function fetchClients() {
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}`);
      if (res.ok) setClients(await res.json());
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Client deleted");
        fetchClients();
      }
    } catch {
      toast.error("Failed to delete client");
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Clients">
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Clients">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <Button onClick={() => router.push("/clients/new")}>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">
              {search ? "No clients match your search" : "No clients yet. Add your first client."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Projects</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-card-foreground">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.company || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{client.email || "-"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {client.projectType ? (
                        <Badge variant="info">{client.projectType}</Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client._count.projects}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => handleDelete(client.id, e)}
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
