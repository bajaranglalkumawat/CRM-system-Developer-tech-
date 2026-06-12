import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monitors = await prisma.monitoringLog.findMany();

    const results = await Promise.all(
      monitors.map(async (monitor: { id: string; url: string }) => {
        let status: "UP" | "DOWN" = "DOWN";
        let statusCode: number | null = null;
        let responseTime: number | null = null;

        try {
          const start = Date.now();
          const response = await fetch(monitor.url, {
            method: "HEAD",
            signal: AbortSignal.timeout(10000),
          });
          responseTime = Date.now() - start;
          statusCode = response.status;
          status = response.ok ? "UP" : "DOWN";
        } catch {
          status = "DOWN";
        }

        return prisma.monitoringLog.update({
          where: { id: monitor.id },
          data: {
            status,
            statusCode,
            lastChecked: new Date(),
            responseTime,
          },
        });
      })
    );

    return NextResponse.json({ checked: results.length, results });
  } catch (error) {
    console.error("Monitoring check error:", error);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
