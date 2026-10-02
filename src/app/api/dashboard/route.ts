import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import {
  financialAccounts,
  transactions,
  budgets,
  budgetItems,
  recurringPatterns,
  financialGoals,
  providerConnections,
  institutions,
  notifications,
  transactionCategories,
} from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Accounts
    const accounts = await db
      .select({
        account: financialAccounts,
        connection: providerConnections,
        institution: institutions,
      })
      .from(financialAccounts)
      .leftJoin(providerConnections, eq(financialAccounts.connectionId, providerConnections.id))
      .leftJoin(institutions, eq(providerConnections.institutionId, institutions.id))
      .where(and(eq(financialAccounts.userId, user.id), eq(financialAccounts.isActive, true)));

    // Calculate balances
    let totalAssets = 0;
    let totalLiabilities = 0;
    let availableFunds = 0;

    accounts.forEach(({ account }) => {
      const bal = parseFloat(account.currentBalance || "0");
      if (account.type === "credit_card" || account.type === "line_of_credit" || account.type === "loan" || account.type === "manual_debt") {
        totalLiabilities += Math.abs(bal);
      } else {
        totalAssets += bal;
        const avail = account.availableBalance ? parseFloat(account.availableBalance) : bal;
        availableFunds += avail;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    // 2. Current Month Cash Flow & Spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTxs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfMonth)
        )
      );

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    const categorySpendingMap: Record<string, number> = {};

    monthTxs.forEach((tx) => {
      if (tx.isTransfer) return; // skip internal transfers from spending totals
      const amt = parseFloat(tx.amount);
      if (amt > 0) {
        monthlyIncome += amt;
      } else {
        const spent = Math.abs(amt);
        monthlyExpenses += spent;
        categorySpendingMap[tx.categoryId] = (categorySpendingMap[tx.categoryId] || 0) + spent;
      }
    });

    const netCashFlow = monthlyIncome - monthlyExpenses;

    // 3. Current Active Budget
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, user.id))
      .orderBy(desc(budgets.createdAt))
      .limit(1);

    let budgetSummary = null;
    if (userBudgets.length > 0) {
      const budget = userBudgets[0];
      const items = await db
        .select({
          item: budgetItems,
          category: transactionCategories,
        })
        .from(budgetItems)
        .leftJoin(transactionCategories, eq(budgetItems.categoryId, transactionCategories.id))
        .where(eq(budgetItems.budgetId, budget.id));

      let totalAllocated = 0;
      let totalSpentInBudget = 0;

      const formattedItems = items.map(({ item, category }) => {
        const alloc = parseFloat(item.allocatedAmount);
        const spent = categorySpendingMap[item.categoryId] || 0;
        const remaining = alloc - spent;
        const percent = alloc > 0 ? Math.min(100, Math.round((spent / alloc) * 100)) : 0;
        totalAllocated += alloc;
        totalSpentInBudget += spent;

        return {
          id: item.id,
          categoryId: item.categoryId,
          categoryName: category?.name || item.categoryId,
          color: category?.color || "#6366f1",
          icon: category?.icon || "Tag",
          allocated: alloc,
          spent,
          remaining,
          percentUsed: percent,
          isWarning: percent >= 75 && percent < 90,
          isCritical: percent >= 90,
        };
      });

      budgetSummary = {
        budgetId: budget.id,
        budgetName: budget.name,
        totalAllocated,
        totalSpent: totalSpentInBudget,
        remaining: totalAllocated - totalSpentInBudget,
        percentUsed: totalAllocated > 0 ? Math.round((totalSpentInBudget / totalAllocated) * 100) : 0,
        items: formattedItems,
      };
    }

    // 4. Recurring Income summary
    const recurring = await db
      .select()
      .from(recurringPatterns)
      .where(and(eq(recurringPatterns.userId, user.id), eq(recurringPatterns.type, "income")))
      .orderBy(recurringPatterns.nextExpectedDate);

    // 5. Goals summary
    const goals = await db
      .select()
      .from(financialGoals)
      .where(eq(financialGoals.userId, user.id))
      .orderBy(desc(financialGoals.createdAt));

    const goalsSummary = goals.map((g) => {
      const current = parseFloat(g.currentAmount);
      const target = parseFloat(g.targetAmount);
      const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      return {
        ...g,
        currentAmountNum: current,
        targetAmountNum: target,
        percentComplete: percent,
      };
    });

    // 6. Recent Transactions
    const recentTransactions = await db
      .select({
        transaction: transactions,
        category: transactionCategories,
        account: financialAccounts,
      })
      .from(transactions)
      .leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
      .leftJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.date))
      .limit(10);

    // 7. Unread Notifications Count
    const unreadNotifs = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    // 8. Provider Connections Health
    const connections = await db
      .select({
        connection: providerConnections,
        institution: institutions,
      })
      .from(providerConnections)
      .leftJoin(institutions, eq(providerConnections.institutionId, institutions.id))
      .where(eq(providerConnections.userId, user.id));

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        timezone: user.timezone,
      },
      summary: {
        totalAssets,
        totalLiabilities,
        netWorth,
        availableFunds,
        monthlyIncome,
        monthlyExpenses,
        netCashFlow,
        unreadNotifications: Number(unreadNotifs[0]?.count || 0),
      },
      accounts: accounts.map((a) => ({
        ...a.account,
        institutionName: a.institution?.name || "Institution",
        institutionLogo: a.institution?.logoUrl,
        institutionColor: a.institution?.primaryColor || "#0284c7",
      })),
      budget: budgetSummary,
      recurringIncome: recurring,
      goals: goalsSummary,
      recentTransactions: recentTransactions.map((t) => ({
        ...t.transaction,
        categoryName: t.category?.name || "Other",
        categoryColor: t.category?.color || "#9ca3af",
        categoryIcon: t.category?.icon || "Tag",
        accountName: t.account?.name || "Account",
      })),
      connections: connections.map((c) => ({
        ...c.connection,
        institutionName: c.institution?.name || "Bank",
        institutionLogo: c.institution?.logoUrl,
      })),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard data" }, { status: 500 });
  }
}
