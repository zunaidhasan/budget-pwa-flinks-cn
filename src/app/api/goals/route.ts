import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { financialGoals, goalContributions, financialAccounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await db
      .select({
        goal: financialGoals,
        account: financialAccounts,
      })
      .from(financialGoals)
      .leftJoin(financialAccounts, eq(financialGoals.linkedAccountId, financialAccounts.id))
      .where(eq(financialGoals.userId, user.id))
      .orderBy(desc(financialGoals.createdAt));

    const goalsWithContributions = await Promise.all(
      goals.map(async ({ goal, account }) => {
        const contribs = await db
          .select()
          .from(goalContributions)
          .where(eq(goalContributions.goalId, goal.id))
          .orderBy(desc(goalContributions.contributionDate))
          .limit(5);

        const current = parseFloat(goal.currentAmount);
        const target = parseFloat(goal.targetAmount);
        const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

        // Calculate periodic contribution needed
        let remainingMonths = 12;
        if (goal.targetDate) {
          const diffMs = new Date(goal.targetDate).getTime() - Date.now();
          remainingMonths = Math.max(1, Math.round(diffMs / (1000 * 3600 * 24 * 30.4)));
        }
        const neededPerMonth = Math.max(0, (target - current) / remainingMonths);

        return {
          ...goal,
          currentAmountNum: current,
          targetAmountNum: target,
          percentComplete: percent,
          neededPerMonth: parseFloat(neededPerMonth.toFixed(2)),
          linkedAccountName: account?.name,
          contributions: contribs,
        };
      })
    );

    return NextResponse.json({ goals: goalsWithContributions });
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
    const { title, type, targetAmount, currentAmount, targetDate, linkedAccountId, notes } = body;

    if (!title || !targetAmount) {
      return NextResponse.json({ error: "Title and target amount are required" }, { status: 400 });
    }

    const [goal] = await db
      .insert(financialGoals)
      .values({
        userId: user.id,
        title,
        type: type || "general_savings",
        targetAmount: parseFloat(targetAmount).toFixed(2),
        currentAmount: (parseFloat(currentAmount) || 0).toFixed(2),
        targetDate: targetDate ? new Date(targetDate) : null,
        linkedAccountId: linkedAccountId || null,
        notes: notes || null,
        status: "in_progress",
      })
      .returning();

    return NextResponse.json({ success: true, goal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
