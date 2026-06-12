"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function NewInvoicePage() {
  const router = useRouter();

  async function handleSubmit(data: {
    serviceName: string;
    amount: number | string;
    date: string;
    status: string;
    clientId: string;
  }) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Invoice created successfully");
      router.push("/invoices");
    } else {
      toast.error("Failed to create invoice");
    }
  }

  return (
    <DashboardLayout title="New Invoice">
      <Card title="Create New Invoice">
        <InvoiceForm onSubmit={handleSubmit} />
      </Card>
    </DashboardLayout>
  );
}
