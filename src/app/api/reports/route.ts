import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Category-wise revenue
    const invoiceItems = await prisma.invoiceItem.findMany({
      include: {
        service: { select: { name: true, category: { select: { name: true } } } },
      },
    });

    const categoryRevenue: Record<string, number> = {};
    const serviceRevenue: Record<string, number> = {};

    for (const item of invoiceItems) {
      const catName = item.categoryName || item.service?.category?.name || "Uncategorized";
      categoryRevenue[catName] = (categoryRevenue[catName] || 0) + item.amount;
      serviceRevenue[item.serviceName] = (serviceRevenue[item.serviceName] || 0) + item.amount;
    }

    // Monthly income (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyInvoices = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        date: { gte: twelveMonthsAgo },
      },
      select: { date: true, totalAmount: true, amount: true },
      orderBy: { date: "asc" },
    });

    const monthlyIncome: Record<string, number> = {};
    for (const inv of monthlyInvoices) {
      const key = `${inv.date.getFullYear()}-${String(inv.date.getMonth() + 1).padStart(2, "0")}`;
      monthlyIncome[key] = (monthlyIncome[key] || 0) + (inv.totalAmount || inv.amount || 0);
    }

    // Pending payments
    const pendingInvoices = await prisma.invoice.findMany({
      where: { status: "PENDING" },
      orderBy: { date: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });

    const pendingPayments = pendingInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      company: inv.client.company,
      amount: inv.totalAmount || inv.amount || 0,
      date: inv.date,
    }));

    // Top services
    const topServices = Object.entries(serviceRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Category revenue sorted
    const categoryRevenueSorted = Object.entries(categoryRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      categoryRevenue: categoryRevenueSorted,
      topServices,
      monthlyIncome,
      pendingPayments,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
