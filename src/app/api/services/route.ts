import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categoryId = request.nextUrl.searchParams.get("categoryId");
    const activeOnly = request.nextUrl.searchParams.get("active");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (activeOnly === "true") where.isActive = "ACTIVE";

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Services GET error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, categoryId, duration, amount, taxPercent, isActive } = body;

    if (!name || !categoryId || amount === undefined) {
      return NextResponse.json({ error: "Name, category, and amount are required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        categoryId,
        duration: duration || "ONE_TIME",
        amount: parseFloat(amount),
        taxPercent: taxPercent ? parseFloat(taxPercent) : 18,
        isActive: isActive || "ACTIVE",
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Services POST error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
