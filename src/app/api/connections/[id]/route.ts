import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { providerConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await db
      .delete(providerConnections)
      .where(and(eq(providerConnections.id, id), eq(providerConnections.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Connection not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Connection removed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
