import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalClients,
      activeProjects,
      paidInvoices,
      pendingInvoices,
      recentClients,
      recentProjects,
      recentInvoices,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.project.count({
        where: { status: { not: "COMPLETED" } },
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" },
      }),
      prisma.client.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true, status: true },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          serviceName: true,
          createdAt: true,
          amount: true,
        },
      }),
    ]);

    const recentActivity = [
      ...recentClients.map((c: { id: string; name: string; createdAt: Date }) => ({
        id: c.id,
        type: "client" as const,
        action: "New client added",
        name: c.name,
        date: c.createdAt.toISOString(),
      })),
      ...recentProjects.map((p: { id: string; title: string; createdAt: Date; status: string }) => ({
        id: p.id,
        type: "project" as const,
        action: "Project created",
        name: p.title,
        date: p.createdAt.toISOString(),
      })),
      ...recentInvoices.map((i: { id: string; invoiceNumber: string; serviceName: string | null; createdAt: Date; amount: number | null }) => ({
        id: i.id,
        type: "invoice" as const,
        action: `Invoice ${i.invoiceNumber}`,
        name: i.serviceName || "Invoice",
        date: i.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalClients,
      activeProjects,
      totalRevenue: paidInvoices._sum.amount || 0,
      pendingPayments: pendingInvoices._sum.amount || 0,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
