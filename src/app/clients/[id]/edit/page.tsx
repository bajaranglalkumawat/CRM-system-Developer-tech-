"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientForm } from "@/components/clients/ClientForm";
import { Card } from "@/components/ui/Card";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface ClientData {
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  projectType: string;
  notes: string;
}

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (res.ok) {
          const client = await res.json();
          setData({
            name: client.name || "",
            phone: client.phone || "",
            email: client.email || "",
            company: client.company || "",
            address: client.address || "",
            projectType: client.projectType || "",
            notes: client.notes || "",
          });
        }
      } catch {
        toast.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [id]);

  async function handleSubmit(formData: ClientData) {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      toast.success("Client updated successfully");
      router.push(`/clients/${id}`);
    } else {
      toast.error("Failed to update client");
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Edit Client">
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Client">
      <Card title="Edit Client">
        {data && (
          <ClientForm
            initialData={data}
            onSubmit={handleSubmit}
            isEdit
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
