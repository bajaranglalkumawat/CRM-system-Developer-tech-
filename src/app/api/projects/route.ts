import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status");

    const projects = await prisma.project.findMany({
      where: status ? { status: status as "PENDING" | "WORKING" | "DELIVERED" | "COMPLETED" } : undefined,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, company: true } } },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, dueDate, progress, clientId } = body;

    if (!title || !clientId) {
      return NextResponse.json({ error: "Title and client are required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        status: status || "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
        progress: progress || 0,
        clientId,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
