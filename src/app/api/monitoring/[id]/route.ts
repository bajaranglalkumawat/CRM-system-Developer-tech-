import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.monitoringLog.delete({ where: { id } });

    return NextResponse.json({ message: "Monitor deleted" });
  } catch (error) {
    console.error("Monitor DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 });
  }
}
