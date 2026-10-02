import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { providerConnections, institutions, financialAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conns = await db
      .select({
        connection: providerConnections,
        institution: institutions,
      })
      .from(providerConnections)
      .leftJoin(institutions, eq(providerConnections.institutionId, institutions.id))
      .where(eq(providerConnections.userId, user.id));

    const connectionsWithAccounts = await Promise.all(
      conns.map(async ({ connection, institution }) => {
        const accs = await db
          .select()
          .from(financialAccounts)
          .where(and(eq(financialAccounts.connectionId, connection.id), eq(financialAccounts.isActive, true)));

        return {
          ...connection,
          institution,
          accounts: accs,
        };
      })
    );

    return NextResponse.json({ connections: connectionsWithAccounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
