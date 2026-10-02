import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { institutions, providerConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FlinksService } from "@/lib/flinks-service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { institutionId, flinksLoginId, simulateSync } = body;

    if (!institutionId) {
      return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
    }

    const inst = await db.select().from(institutions).where(eq(institutions.id, institutionId)).limit(1);
    if (inst.length === 0) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const assignedLoginId = flinksLoginId || `flinks_login_ca_${institutionId}_${Math.random().toString(36).substring(2, 8)}`;
    const flinksRequestId = `req_flinks_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create provider connection
    const [conn] = await db
      .insert(providerConnections)
      .values({
        userId: user.id,
        institutionId,
        flinksLoginId: assignedLoginId,
        flinksRequestId,
        status: "active",
        lastSyncStatus: "pending",
      })
      .returning();

    // If simulateSync requested or default demo run
    if (simulateSync !== false) {
      const { rawAccounts, rawTransactions } = FlinksService.generateMockCanadianData(institutionId, inst[0].name);
      await FlinksService.syncConnectionData(user.id, conn.id, rawAccounts, rawTransactions, "manual");
    }

    return NextResponse.json({
      success: true,
      connectionId: conn.id,
      institution: inst[0],
      flinksLoginId: assignedLoginId,
      flinksRequestId,
      connectUrl: `https://toolbox-api.flinks.com/v3/connect?demo=true&institution=${institutionId}`,
    });
  } catch (err: any) {
    console.error("Flinks session error:", err);
    return NextResponse.json({ error: err.message || "Failed to initialize Flinks session" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const list = await db.select().from(institutions);
    return NextResponse.json({ institutions: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
