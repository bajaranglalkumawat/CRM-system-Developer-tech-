import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, calculateInvoiceTotals } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = request.nextUrl.searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: {
          select: { id: true, serviceName: true, categoryName: true, quantity: true, unitPrice: true, discount: true, taxPercent: true, amount: true },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { clientId, date, dueDate, status, notes, items } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client is required" }, { status: 400 });
    }

    // Calculate totals from items
    const invoiceItems = (items || []).map(
      (item: { serviceName: string; unitPrice: number; quantity: number; discount: number; taxPercent: number; serviceId?: string; categoryName?: string }) => ({
        serviceName: item.serviceName,
        categoryName: item.categoryName || null,
        serviceId: item.serviceId || null,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxPercent: item.taxPercent ?? 18,
        amount: 0, // calculated below
      })
    );

    // Calculate each item's amount
    for (const item of invoiceItems) {
      const gross = item.unitPrice * item.quantity;
      const afterDiscount = gross - (gross * item.discount) / 100;
      item.amount = afterDiscount + (afterDiscount * item.taxPercent) / 100;
    }

    const totals = calculateInvoiceTotals(
      invoiceItems.map((i: { unitPrice: number; quantity: number; discount: number; taxPercent: number }) => ({
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        discount: i.discount,
        taxPercent: i.taxPercent,
      }))
    );

    // Backward compat: serviceName and amount from first item or joined names
    const serviceName = invoiceItems.length > 0
      ? invoiceItems.map((i: { serviceName: string }) => i.serviceName).join(", ")
      : body.serviceName || "";
    const amount = totals.totalAmount || body.amount || 0;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        serviceName,
        amount,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discount: totals.discount,
        totalAmount: totals.totalAmount,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        status: status || "PENDING",
        clientId,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoices POST error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
