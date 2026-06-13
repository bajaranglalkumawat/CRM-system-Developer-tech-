"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";
import { formatCurrency, calculateItemAmount, calculateTax } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface CategoryService {
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
  services: CategoryService[];
}

interface InvoiceLineItem {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  amount: number;
}

interface InvoiceFormProps {
  initialData?: {
    clientId: string;
    date: string;
    dueDate: string;
    status: string;
    notes: string;
    items: InvoiceLineItem[];
  };
  onSubmit: (data: {
    clientId: string;
    date: string;
    dueDate: string;
    status: string;
    notes: string;
    items: InvoiceLineItem[];
  }) => Promise<void>;
  isEdit?: boolean;
}

export function InvoiceForm({ initialData, onSubmit, isEdit }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [form, setForm] = useState({
    clientId: initialData?.clientId || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate || "",
    status: initialData?.status || "PENDING",
    notes: initialData?.notes || "",
  });

  const [items, setItems] = useState<InvoiceLineItem[]>(initialData?.items || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [clientsRes, catsRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/services/categories"),
      ]);
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    }
    fetchData();
  }, []);

  // Available services for selected category
  const availableServices = useMemo(() => {
    if (!selectedCategoryId) return [];
    const cat = categories.find((c) => c.id === selectedCategoryId);
    return cat?.services.filter((s) => s.isActive === "ACTIVE") || [];
  }, [selectedCategoryId, categories]);

  function addItem() {
    if (!selectedServiceId) return;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    const svc = cat?.services.find((s) => s.id === selectedServiceId);
    if (!svc) return;

    const newItem: InvoiceLineItem = {
      serviceId: svc.id,
      serviceName: svc.name,
      categoryName: cat!.name,
      quantity: 1,
      unitPrice: svc.amount,
      discount: 0,
      taxPercent: svc.taxPercent,
      amount: calculateItemAmount(svc.amount, 1, 0) + calculateTax(calculateItemAmount(svc.amount, 1, 0), svc.taxPercent),
    };

    setItems([...items, newItem]);
    setSelectedCategoryId("");
    setSelectedServiceId("");
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof InvoiceLineItem, value: number) {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    const afterDiscount = calculateItemAmount(updated[idx].unitPrice, updated[idx].quantity, updated[idx].discount);
    updated[idx].amount = afterDiscount + calculateTax(afterDiscount, updated[idx].taxPercent);
    setItems(updated);
  }

  // Calculate totals
  const subtotal = useMemo(() => items.reduce((sum, item) => {
    const gross = item.unitPrice * item.quantity;
    const afterDiscount = gross - (gross * item.discount) / 100;
    return sum + afterDiscount;
  }, 0), [items]);

  const taxAmount = useMemo(() => items.reduce((sum, item) => {
    const gross = item.unitPrice * item.quantity;
    const afterDiscount = gross - (gross * item.discount) / 100;
    return sum + calculateTax(afterDiscount, item.taxPercent);
  }, 0), [items]);

  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, items });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client & dates */}
      <div className="grid gap-4 sm:grid-cols-2">
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
        <Input
          label="Invoice Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <Input
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
      </div>

      {/* Add Service */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="mb-3 text-sm font-semibold text-card-foreground">Add Service</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Category"
            value={selectedCategoryId}
            onChange={(e) => { setSelectedCategoryId(e.target.value); setSelectedServiceId(""); }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
          />
          <Select
            label="Service"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={availableServices.map((s) => ({ value: s.id, label: `${s.name} - ${formatCurrency(s.amount)}` }))}
            placeholder="Select service"
            disabled={!selectedCategoryId}
          />
          <div className="flex items-end">
            <Button type="button" variant="secondary" size="sm" onClick={addItem} disabled={!selectedServiceId}>
              <Plus className="h-4 w-4" /> Add to Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Line Items */}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Qty</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Rate</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Disc%</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">GST%</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground w-28">Amount</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {items.map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="px-3 py-2 font-medium text-card-foreground">{item.serviceName}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{item.categoryName}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-16 rounded border border-border bg-background px-2 py-1 text-center text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-24 rounded border border-border bg-background px-2 py-1 text-center text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)}
                      className="w-16 rounded border border-border bg-background px-2 py-1 text-center text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.taxPercent}
                      onChange={(e) => updateItem(idx, "taxPercent", parseFloat(e.target.value) || 0)}
                      className="w-16 rounded border border-border bg-background px-2 py-1 text-center text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-card-foreground">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="w-72 space-y-2 rounded-lg border border-border bg-card p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-card-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="font-medium text-card-foreground">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-card-foreground">Grand Total</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <Input
        label="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Optional notes for this invoice"
      />

      <Button type="submit" loading={loading} disabled={items.length === 0}>
        {isEdit ? "Update Invoice" : "Create Invoice"}
      </Button>
    </form>
  );
}
