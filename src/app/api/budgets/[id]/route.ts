import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { budgets, budgetItems } from "@/db/schema";
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
    const { name, items } = body;

    const existing = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (name) {
      await db.update(budgets).set({ name, updatedAt: new Date() }).where(eq(budgets.id, id));
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          await db
            .update(budgetItems)
            .set({
              allocatedAmount: parseFloat(item.allocatedAmount).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(budgetItems.id, item.id));
        } else if (item.categoryId && parseFloat(item.allocatedAmount) >= 0) {
          await db.insert(budgetItems).values({
            budgetId: id,
            categoryId: item.categoryId,
            allocatedAmount: parseFloat(item.allocatedAmount).toFixed(2),
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Budget updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
