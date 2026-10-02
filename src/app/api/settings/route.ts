import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { userSettings, users, financialAccounts, transactions, budgets, financialGoals, recurringPatterns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);

    return NextResponse.json({
      user,
      settings: settings[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { budgetPeriod, payCycle, warningThreshold1, warningThreshold2, privacyMode, excludeTransfersFromSpending } = body;

    const [updated] = await db
      .update(userSettings)
      .set({
        budgetPeriod,
        payCycle,
        warningThreshold1: warningThreshold1 ? parseInt(warningThreshold1, 10) : undefined,
        warningThreshold2: warningThreshold2 ? parseInt(warningThreshold2, 10) : undefined,
        privacyMode,
        excludeTransfersFromSpending,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, user.id))
      .returning();

    return NextResponse.json({ success: true, settings: updated });
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
    const { action } = body;

    if (action === "seed_demo_data") {
      await seedDatabase();
      return NextResponse.json({ success: true, message: "Sample Canadian financial data verified/seeded" });
    }

    if (action === "export_data") {
      // Canadian financial privacy export
      const userAccs = await db.select().from(financialAccounts).where(eq(financialAccounts.userId, user.id));
      const userTxs = await db.select().from(transactions).where(eq(transactions.userId, user.id));
      const userBuds = await db.select().from(budgets).where(eq(budgets.userId, user.id));
      const userGoals = await db.select().from(financialGoals).where(eq(financialGoals.userId, user.id));
      const userRecurring = await db.select().from(recurringPatterns).where(eq(recurringPatterns.userId, user.id));

      return NextResponse.json({
        exportDate: new Date().toISOString(),
        user: { name: user.name, email: user.email, currency: user.currency },
        accounts: userAccs,
        transactions: userTxs,
        budgets: userBuds,
        goals: userGoals,
        recurringPatterns: userRecurring,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
