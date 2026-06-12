"use client";

import { useState, useEffect } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ProjectFormProps {
  initialData?: {
    title: string;
    description: string;
    status: string;
    dueDate: string;
    progress: number;
    clientId: string;
  };
  onSubmit: (data: {
    title: string;
    description: string;
    status: string;
    dueDate: string;
    progress: number;
    clientId: string;
  }) => Promise<void>;
  isEdit?: boolean;
}

interface Client {
  id: string;
  name: string;
}

export function ProjectForm({ initialData, onSubmit, isEdit }: ProjectFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "PENDING",
    dueDate: initialData?.dueDate || "",
    progress: initialData?.progress ?? 0,
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
        label="Project Title *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        placeholder="Project title"
      />
      <Select
        label="Client *"
        value={form.clientId}
        onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        options={clients.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Select a client"
        required
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Project description..."
        rows={3}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "WORKING", label: "Working" },
            { value: "DELIVERED", label: "Delivered" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
        <Input
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-card-foreground">
            Progress ({form.progress}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={form.progress}
            onChange={(e) =>
              setForm({ ...form, progress: parseInt(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>
      </div>
      <Button type="submit" loading={loading}>
        {isEdit ? "Update Project" : "Create Project"}
      </Button>
    </form>
  );
}
