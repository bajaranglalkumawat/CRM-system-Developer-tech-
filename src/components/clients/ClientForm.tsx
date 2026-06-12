"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ClientFormProps {
  initialData?: {
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    projectType: string;
    notes: string;
  };
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string;
    company: string;
    address: string;
    projectType: string;
    notes: string;
  }) => Promise<void>;
  isEdit?: boolean;
}

export function ClientForm({ initialData, onSubmit, isEdit }: ClientFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    company: initialData?.company || "",
    address: initialData?.address || "",
    projectType: initialData?.projectType || "",
    notes: initialData?.notes || "",
  });
  const [loading, setLoading] = useState(false);

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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="Client name"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+91 XXXXX XXXXX"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="client@example.com"
        />
        <Input
          label="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="Company name"
        />
        <Input
          label="Project Type"
          value={form.projectType}
          onChange={(e) => setForm({ ...form, projectType: e.target.value })}
          placeholder="Web Development, App, etc."
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="City, State"
        />
      </div>
      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Additional notes..."
        rows={4}
      />
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? "Update Client" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
