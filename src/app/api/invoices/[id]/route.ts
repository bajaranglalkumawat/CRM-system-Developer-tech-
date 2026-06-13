import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateInvoiceTotals } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true, phone: true, address: true } },
        items: {
          include: { service: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        payments: { orderBy: { date: "desc" } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, date, dueDate, notes, items } = body;

    // If items are provided, recalculate and update them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...(status && { status }),
      ...(date && { date: new Date(date) }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(notes !== undefined && { notes: notes || null }),
    };

    if (items && Array.isArray(items)) {
      // Delete old items and create new ones
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoiceItems = items.map((item: any) => {
        const gross = item.unitPrice * (item.quantity || 1);
        const afterDiscount = gross - (gross * (item.discount || 0)) / 100;
        const amount = afterDiscount + (afterDiscount * (item.taxPercent || 18)) / 100;
        return {
          serviceName: item.serviceName,
          categoryName: item.categoryName || null,
          serviceId: item.serviceId || null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxPercent: item.taxPercent || 18,
          amount,
        };
      });

      const totals = calculateInvoiceTotals(
        invoiceItems.map((i: { unitPrice: number; quantity: number; discount: number; taxPercent: number }) => ({
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          discount: i.discount,
          taxPercent: i.taxPercent,
        }))
      );

      updateData.items = { create: invoiceItems };
      updateData.serviceName = invoiceItems.map((i: { serviceName: string }) => i.serviceName).join(", ");
      updateData.amount = totals.totalAmount;
      updateData.subtotal = totals.subtotal;
      updateData.taxAmount = totals.taxAmount;
      updateData.discount = totals.discount;
      updateData.totalAmount = totals.totalAmount;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice PUT error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error("Invoice DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
