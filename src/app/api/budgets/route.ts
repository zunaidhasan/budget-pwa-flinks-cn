import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { budgets, budgetItems, transactionCategories, transactions } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, user.id))
      .orderBy(desc(budgets.startDate));

    const categories = await db.select().from(transactionCategories).orderBy(transactionCategories.sortOrder);

    // Hydrate each budget with items & actual spending
    const hydrated = await Promise.all(
      allBudgets.map(async (b) => {
        const items = await db
          .select({
            item: budgetItems,
            category: transactionCategories,
          })
          .from(budgetItems)
          .leftJoin(transactionCategories, eq(budgetItems.categoryId, transactionCategories.id))
          .where(eq(budgetItems.budgetId, b.id));

        // Get spending in this period
        const periodTxs = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, user.id),
              gte(transactions.date, b.startDate),
              lte(transactions.date, b.endDate),
              eq(transactions.isTransfer, false)
            )
          );

        const spendingMap: Record<string, number> = {};
        periodTxs.forEach((tx) => {
          const amt = parseFloat(tx.amount);
          if (amt < 0) {
            spendingMap[tx.categoryId] = (spendingMap[tx.categoryId] || 0) + Math.abs(amt);
          }
        });

        let totalAllocated = 0;
        let totalSpent = 0;

        const detailedItems = items.map(({ item, category }) => {
          const alloc = parseFloat(item.allocatedAmount);
          const spent = spendingMap[item.categoryId] || 0;
          totalAllocated += alloc;
          totalSpent += spent;
          const remaining = alloc - spent;
          const utilization = alloc > 0 ? (spent / alloc) * 100 : 0;

          return {
            id: item.id,
            categoryId: item.categoryId,
            categoryName: category?.name || item.categoryId,
            color: category?.color || "#6366f1",
            icon: category?.icon || "Tag",
            allocated: alloc,
            spent,
            remaining,
            utilization: Math.round(utilization),
            status: utilization > 100 ? "exceeded" : utilization >= 90 ? "critical" : utilization >= 75 ? "warning" : "ok",
          };
        });

        return {
          ...b,
          totalAllocated,
          totalSpent,
          remaining: totalAllocated - totalSpent,
          utilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
          items: detailedItems,
        };
      })
    );

    return NextResponse.json({
      budgets: hydrated,
      categories,
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
    const { name, periodType, startDate, endDate, items } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Name, startDate, and endDate are required" }, { status: 400 });
    }

    const [budget] = await db
      .insert(budgets)
      .values({
        userId: user.id,
        name,
        periodType: periodType || "monthly",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
      .returning();

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (parseFloat(item.allocatedAmount) > 0) {
          await db.insert(budgetItems).values({
            budgetId: budget.id,
            categoryId: item.categoryId,
            allocatedAmount: parseFloat(item.allocatedAmount).toFixed(2),
            carryOverAmount: (parseFloat(item.carryOverAmount) || 0).toFixed(2),
          });
        }
      }
    }

    return NextResponse.json({ success: true, budget });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
