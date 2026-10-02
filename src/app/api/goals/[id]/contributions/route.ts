import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { financialGoals, goalContributions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    const body = await request.json();
    const { amount, note, contributionDate } = body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "Positive contribution amount is required" }, { status: 400 });
    }

    const goal = await db
      .select()
      .from(financialGoals)
      .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, user.id)))
      .limit(1);

    if (goal.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const [contrib] = await db
      .insert(goalContributions)
      .values({
        goalId: id,
        amount: numAmount.toFixed(2),
        note: note || "Contribution",
        contributionDate: contributionDate ? new Date(contributionDate) : new Date(),
      })
      .returning();

    const newTotal = (parseFloat(goal[0].currentAmount) + numAmount).toFixed(2);
    const isCompleted = parseFloat(newTotal) >= parseFloat(goal[0].targetAmount);

    await db
      .update(financialGoals)
      .set({
        currentAmount: newTotal,
        status: isCompleted ? "completed" : goal[0].status,
        updatedAt: new Date(),
      })
      .where(eq(financialGoals.id, id));

    return NextResponse.json({ success: true, contribution: contrib, newTotal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
