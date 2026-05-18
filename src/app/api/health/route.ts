import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      latencyMs: Date.now() - start,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "down",
        error: err instanceof Error ? err.message : String(err),
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
