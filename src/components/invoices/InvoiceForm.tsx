"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface InvoiceFormProps {
  initialData?: {
    serviceName: string;
    amount: number | string;
    date: string;
    status: string;
    clientId: string;
  };
  onSubmit: (data: {
    serviceName: string;
    amount: number | string;
    date: string;
    status: string;
    clientId: string;
  }) => Promise<void>;
  isEdit?: boolean;
}

interface Client {
  id: string;
  name: string;
}

export function InvoiceForm({ initialData, onSubmit, isEdit }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    serviceName: initialData?.serviceName || "",
    amount: initialData?.amount?.toString() || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    status: initialData?.status || "PENDING",
    clientId: initialData?.clientId || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      const res = await fetch("/api/clients");
      if (res.ok) setClients(await res.json());
    }
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Service Name *"
        value={form.serviceName}
        onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
        required
        placeholder="e.g., Website Development"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount (INR) *"
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <Select
          label="Client *"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select a client"
          required
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "PAID", label: "Paid" },
            { value: "OVERDUE", label: "Overdue" },
          ]}
        />
      </div>
      <Button type="submit" loading={loading}>
        {isEdit ? "Update Invoice" : "Create Invoice"}
      </Button>
    </form>
  );
}
