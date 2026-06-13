import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        services: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, duration: true, amount: true, taxPercent: true, isActive: true },
        },
        _count: { select: { services: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, icon, isActive } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const category = await prisma.serviceCategory.create({
      data: { name, description: description || null, icon: icon || null, isActive: isActive ?? true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
