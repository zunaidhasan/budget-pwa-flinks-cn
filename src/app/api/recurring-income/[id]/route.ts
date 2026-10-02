import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { recurringPatterns, incomeSources } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, name, frequency, expectedAmount, nextExpectedDate, isVariable } = body;

    const existing = await db
      .select()
      .from(recurringPatterns)
      .where(and(eq(recurringPatterns.id, id), eq(recurringPatterns.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateFields.status = status;
    if (name !== undefined) updateFields.name = name;
    if (frequency !== undefined) updateFields.frequency = frequency;
    if (expectedAmount !== undefined) updateFields.expectedAmount = parseFloat(expectedAmount).toFixed(2);
    if (nextExpectedDate !== undefined) updateFields.nextExpectedDate = new Date(nextExpectedDate);
    if (isVariable !== undefined) updateFields.isVariable = isVariable;

    const [updated] = await db
      .update(recurringPatterns)
      .set(updateFields)
      .where(eq(recurringPatterns.id, id))
      .returning();

    // If confirmed, make sure income source exists
    if (status === "confirmed") {
      const existingSource = await db
        .select()
        .from(incomeSources)
        .where(eq(incomeSources.patternId, id))
        .limit(1);

      if (existingSource.length === 0) {
        await db.insert(incomeSources).values({
          userId: user.id,
          patternId: id,
          name: updated.name,
          category: updated.name.toLowerCase().includes("benefit") ? "government_benefit" : "payroll",
          amount: updated.expectedAmount,
          frequency: updated.frequency,
          destinationAccountId: updated.accountId,
          isActive: true,
        });
      }
    }

    return NextResponse.json({ success: true, pattern: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
