"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientForm } from "@/components/clients/ClientForm";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function NewClientPage() {
  const router = useRouter();

  async function handleSubmit(data: {
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    projectType: string;
    notes: string;
  }) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Client created successfully");
      router.push("/clients");
    } else {
      toast.error("Failed to create client");
    }
  }

  return (
    <DashboardLayout title="New Client">
      <Card title="Add New Client">
        <ClientForm onSubmit={handleSubmit} />
      </Card>
    </DashboardLayout>
  );
}
