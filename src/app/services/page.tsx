"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { Plus, Pencil, Trash2, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, durationLabel } from "@/lib/utils";
import toast from "react-hot-toast";

interface Service {
  id: string;
  name: string;
  duration: string;
  amount: number;
  taxPercent: number;
  isActive: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  services: Service[];
  _count: { services: number };
}

const DURATION_OPTIONS = [
  { value: "ONE_TIME", label: "One Time" },
  { value: "THREE_MONTHS", label: "3 Months" },
  { value: "SIX_MONTHS", label: "6 Months" },
  { value: "TWELVE_MONTHS", label: "12 Months" },
];

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [catSaving, setCatSaving] = useState(false);

  // Service modal
  const [svcModal, setSvcModal] = useState(false);
  const [editSvc, setEditSvc] = useState<Service | null>(null);
  const [svcCatId, setSvcCatId] = useState("");
  const [svcForm, setSvcForm] = useState({
    name: "",
    categoryId: "",
    duration: "ONE_TIME",
    amount: "",
    taxPercent: "18",
    isActive: "ACTIVE",
  });
  const [svcSaving, setSvcSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/services/categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Category CRUD
  function openNewCategory() {
    setEditCat(null);
    setCatForm({ name: "", description: "" });
    setCatModal(true);
  }

  function openEditCategory(cat: Category) {
    setEditCat(cat);
    setCatForm({ name: cat.name, description: cat.description || "" });
    setCatModal(true);
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    try {
      const url = editCat
        ? `/api/services/categories/${editCat.id}`
        : "/api/services/categories";
      const method = editCat ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm),
      });
      if (res.ok) {
        toast.success(editCat ? "Category updated" : "Category created");
        setCatModal(false);
        fetchCategories();
      } else {
        toast.error("Failed to save category");
      }
    } catch {
      toast.error("Failed to save category");
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its services?")) return;
    try {
      const res = await fetch(`/api/services/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      }
    } catch {
      toast.error("Failed to delete category");
    }
  }

  // Service CRUD
  function openNewService(categoryId: string) {
    setEditSvc(null);
    setSvcCatId(categoryId);
    setSvcForm({
      name: "",
      categoryId,
      duration: "ONE_TIME",
      amount: "",
      taxPercent: "18",
      isActive: "ACTIVE",
    });
    setSvcModal(true);
  }

  function openEditService(svc: Service & { categoryId?: string }, catId: string) {
    setEditSvc(svc);
    setSvcCatId(catId);
    setSvcForm({
      name: svc.name,
      categoryId: catId,
      duration: svc.duration,
      amount: svc.amount.toString(),
      taxPercent: svc.taxPercent.toString(),
      isActive: svc.isActive,
    });
    setSvcModal(true);
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();
    setSvcSaving(true);
    try {
      const url = editSvc
        ? `/api/services/${editSvc.id}`
        : "/api/services";
      const method = editSvc ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(svcForm),
      });
      if (res.ok) {
        toast.success(editSvc ? "Service updated" : "Service created");
        setSvcModal(false);
        fetchCategories();
      } else {
        toast.error("Failed to save service");
      }
    } catch {
      toast.error("Failed to save service");
    } finally {
      setSvcSaving(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Service deleted");
        fetchCategories();
      }
    } catch {
      toast.error("Failed to delete service");
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Services">
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Services">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
          <Button onClick={openNewCategory}>
            <Plus className="h-4 w-4" /> New Category
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <Layers className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No service categories yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {expanded.has(cat.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-card-foreground">{cat.name}</h3>
                        <Badge variant={cat.isActive ? "success" : "danger"}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <Badge>{cat._count.services} services</Badge>
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {expanded.has(cat.id) && (
                  <div className="mt-4 border-t border-border pt-4">
                    {cat.services.length === 0 ? (
                      <p className="text-xs text-muted-foreground mb-2">No services in this category.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Duration</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Amount</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">GST</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {cat.services.map((svc) => (
                              <tr key={svc.id} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-medium text-card-foreground">{svc.name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{durationLabel(svc.duration)}</td>
                                <td className="px-3 py-2 font-medium text-card-foreground">{formatCurrency(svc.amount)}</td>
                                <td className="px-3 py-2 text-muted-foreground">{svc.taxPercent}%</td>
                                <td className="px-3 py-2">
                                  <Badge variant={svc.isActive === "ACTIVE" ? "success" : "danger"}>
                                    {svc.isActive}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => openEditService({ ...svc, categoryId: cat.id } as Service & { categoryId: string }, cat.id)}
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteService(svc.id)}
                                      className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => openNewService(cat.id)}>
                      <Plus className="h-3.5 w-3.5" /> Add Service
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title={editCat ? "Edit Category" : "New Category"}>
        <form onSubmit={saveCategory} className="space-y-4">
          <Input
            label="Category Name *"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
            placeholder="e.g., Web Development"
          />
          <Input
            label="Description"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
            placeholder="Brief description"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCatModal(false)}>Cancel</Button>
            <Button type="submit" loading={catSaving}>{editCat ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Service Modal */}
      <Modal isOpen={svcModal} onClose={() => setSvcModal(false)} title={editSvc ? "Edit Service" : "New Service"}>
        <form onSubmit={saveService} className="space-y-4">
          <Input
            label="Service Name *"
            value={svcForm.name}
            onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
            required
            placeholder="e.g., Website Development"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Duration"
              value={svcForm.duration}
              onChange={(e) => setSvcForm({ ...svcForm, duration: e.target.value })}
              options={DURATION_OPTIONS}
            />
            <Input
              label="Amount (INR) *"
              type="number"
              value={svcForm.amount}
              onChange={(e) => setSvcForm({ ...svcForm, amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
            <Input
              label="GST %"
              type="number"
              value={svcForm.taxPercent}
              onChange={(e) => setSvcForm({ ...svcForm, taxPercent: e.target.value })}
              min="0"
              max="100"
            />
            <Select
              label="Status"
              value={svcForm.isActive}
              onChange={(e) => setSvcForm({ ...svcForm, isActive: e.target.value })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setSvcModal(false)}>Cancel</Button>
            <Button type="submit" loading={svcSaving}>{editSvc ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
