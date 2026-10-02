import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { financialAccounts, providerConnections, institutions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        account: financialAccounts,
        connection: providerConnections,
        institution: institutions,
      })
      .from(financialAccounts)
      .leftJoin(providerConnections, eq(financialAccounts.connectionId, providerConnections.id))
      .leftJoin(institutions, eq(providerConnections.institutionId, institutions.id))
      .where(and(eq(financialAccounts.userId, user.id), eq(financialAccounts.isActive, true)));

    return NextResponse.json({
      accounts: rows.map((r) => ({
        ...r.account,
        institutionName: r.institution?.name || (r.account.isManual ? "Manual Account" : "Canadian Bank"),
        institutionLogo: r.institution?.logoUrl,
        institutionColor: r.institution?.primaryColor || "#0f766e",
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, currentBalance, currency } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const [newAccount] = await db
      .insert(financialAccounts)
      .values({
        userId: user.id,
        name,
        type,
        currentBalance: (parseFloat(currentBalance) || 0).toFixed(2),
        currency: currency || "CAD",
        isManual: true,
        accountNumberMask: "MANUAL",
        syncHealth: "healthy",
      })
      .returning();

    return NextResponse.json({ success: true, account: newAccount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
