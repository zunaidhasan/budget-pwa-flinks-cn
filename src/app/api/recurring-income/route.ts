import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { recurringPatterns, incomeSources, financialAccounts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { FlinksService } from "@/lib/flinks-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger detection to ensure newly synced transactions are reflected
    await FlinksService.detectRecurringIncome(user.id);

    const patterns = await db
      .select({
        pattern: recurringPatterns,
        account: financialAccounts,
      })
      .from(recurringPatterns)
      .leftJoin(financialAccounts, eq(recurringPatterns.accountId, financialAccounts.id))
      .where(eq(recurringPatterns.userId, user.id))
      .orderBy(desc(recurringPatterns.confidenceScore));

    const sources = await db
      .select()
      .from(incomeSources)
      .where(and(eq(incomeSources.userId, user.id), eq(incomeSources.isActive, true)));

    return NextResponse.json({
      patterns: patterns.map((p) => ({
        ...p.pattern,
        accountName: p.account?.name || "Canadian Account",
      })),
      sources,
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
    const { name, amount, frequency, category, destinationAccountId, nextExpectedDate, notes } = body;

    if (!name || !amount || !frequency) {
      return NextResponse.json({ error: "Name, amount, and frequency are required" }, { status: 400 });
    }

    const [pattern] = await db
      .insert(recurringPatterns)
      .values({
        userId: user.id,
        accountId: destinationAccountId || null,
        name,
        type: "income",
        frequency,
        expectedAmount: parseFloat(amount).toFixed(2),
        status: "manual",
        confidenceScore: "1.00",
        nextExpectedDate: nextExpectedDate ? new Date(nextExpectedDate) : new Date(Date.now() + 14 * 86400000),
        merchantMatch: name,
      })
      .returning();

    const [source] = await db
      .insert(incomeSources)
      .values({
        userId: user.id,
        patternId: pattern.id,
        name,
        category: category || "payroll",
        amount: parseFloat(amount).toFixed(2),
        frequency,
        destinationAccountId: destinationAccountId || null,
        notes: notes || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, pattern, source });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
