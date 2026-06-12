"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function NewProjectPage() {
  const router = useRouter();

  async function handleSubmit(data: {
    title: string;
    description: string;
    status: string;
    dueDate: string;
    progress: number;
    clientId: string;
  }) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Project created successfully");
      router.push("/projects");
    } else {
      toast.error("Failed to create project");
    }
  }

  return (
    <DashboardLayout title="New Project">
      <Card title="Create New Project">
        <ProjectForm onSubmit={handleSubmit} />
      </Card>
    </DashboardLayout>
  );
}
