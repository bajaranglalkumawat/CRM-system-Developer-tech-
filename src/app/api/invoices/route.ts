import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status");

    const invoices = await prisma.invoice.findMany({
      where: status ? { status: status as "PENDING" | "PAID" | "OVERDUE" } : undefined,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, company: true } } },
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceName, amount, date, status, clientId } = body;

    if (!serviceName || !amount || !clientId) {
      return NextResponse.json(
        { error: "Service name, amount, and client are required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        serviceName,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        status: status || "PENDING",
        clientId,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoices POST error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
