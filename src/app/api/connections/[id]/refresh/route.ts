import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { providerConnections, institutions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { FlinksService } from "@/lib/flinks-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const connection = await db
      .select({
        conn: providerConnections,
        inst: institutions,
      })
      .from(providerConnections)
      .leftJoin(institutions, eq(providerConnections.institutionId, institutions.id))
      .where(and(eq(providerConnections.id, id), eq(providerConnections.userId, user.id)))
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const { conn, inst } = connection[0];
    const instId = conn.institutionId;
    const instName = inst?.name || "Canadian Institution";

    // Simulate refresh by generating data or calling Flinks endpoint
    const { rawAccounts, rawTransactions } = FlinksService.generateMockCanadianData(instId, instName);
    const result = await FlinksService.syncConnectionData(user.id, conn.id, rawAccounts, rawTransactions, "manual");

    return NextResponse.json({
      success: true,
      message: `Refreshed ${instName} successfully.`,
      result,
    });
  } catch (err: any) {
    console.error("Refresh error:", err);
    return NextResponse.json({ error: err.message || "Refresh failed" }, { status: 500 });
  }
}
