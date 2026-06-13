import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Add payment to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, date, method } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    // Verify invoice exists
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        method: method || null,
        invoiceId: id,
      },
    });

    // Auto-update invoice status if fully paid
    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId: id },
      _sum: { amount: true },
    });

    const invoiceTotal = invoice.totalAmount || invoice.amount || 0;
    if ((totalPaid._sum.amount || 0) >= invoiceTotal && invoiceTotal > 0) {
      await prisma.invoice.update({
        where: { id },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Payment POST error:", error);
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 });
  }
}

// DELETE - Remove a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    // Verify payment belongs to this invoice
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, invoiceId: id },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    // Re-check invoice status
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (invoice && invoice.status === "PAID") {
      const totalPaid = await prisma.payment.aggregate({
        where: { invoiceId: id },
        _sum: { amount: true },
      });
      const invoiceTotal = invoice.totalAmount || invoice.amount || 0;
      if ((totalPaid._sum.amount || 0) < invoiceTotal) {
        await prisma.invoice.update({
          where: { id },
          data: { status: "PENDING" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
