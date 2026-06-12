import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monitors = await prisma.monitoringLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(monitors);
  } catch (error) {
    console.error("Monitoring GET error:", error);
    return NextResponse.json({ error: "Failed to fetch monitors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check URL immediately
    let status: "UP" | "DOWN" = "DOWN";
    let statusCode: number | null = null;
    let responseTime: number | null = null;

    try {
      const start = Date.now();
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
      });
      responseTime = Date.now() - start;
      statusCode = response.status;
      status = response.ok ? "UP" : "DOWN";
    } catch {
      status = "DOWN";
    }

    const monitor = await prisma.monitoringLog.create({
      data: {
        url,
        status,
        statusCode,
        lastChecked: new Date(),
        responseTime,
      },
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    console.error("Monitoring POST error:", error);
    return NextResponse.json({ error: "Failed to add monitor" }, { status: 500 });
  }
}
