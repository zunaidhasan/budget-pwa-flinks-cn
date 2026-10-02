import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { transactions, transactionCategories, financialAccounts, merchantRules } from "@/db/schema";
import { eq, and, desc, sql, ilike, or, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type"); // income, expense, transfer
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conditions = [eq(transactions.userId, user.id)];

    if (search) {
      conditions.push(
        or(
          ilike(transactions.description, `%${search}%`),
          ilike(transactions.cleanMerchant, `%${search}%`),
          ilike(transactions.notes, `%${search}%`)
        )!
      );
    }

    if (category && category !== "all") {
      conditions.push(eq(transactions.categoryId, category));
    }

    if (accountId && accountId !== "all") {
      conditions.push(eq(transactions.accountId, accountId));
    }

    if (type === "income") {
      conditions.push(sql`cast(${transactions.amount} as numeric) > 0 and ${transactions.isTransfer} = false`);
    } else if (type === "expense") {
      conditions.push(sql`cast(${transactions.amount} as numeric) < 0 and ${transactions.isTransfer} = false`);
    } else if (type === "transfer") {
      conditions.push(eq(transactions.isTransfer, true));
    }

    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate)));
    }

    const rows = await db
      .select({
        transaction: transactions,
        category: transactionCategories,
        account: financialAccounts,
      })
      .from(transactions)
      .leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
      .leftJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    // Total count & stats
    const allCategories = await db.select().from(transactionCategories).orderBy(transactionCategories.sortOrder);

    return NextResponse.json({
      transactions: rows.map((r) => ({
        ...r.transaction,
        categoryName: r.category?.name || "Other",
        categoryColor: r.category?.color || "#9ca3af",
        categoryIcon: r.category?.icon || "Tag",
        accountName: r.account?.name || "Account",
      })),
      categories: allCategories,
      count: rows.length,
    });
  } catch (err: any) {
    console.error("Transactions API error:", err);
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
    const { accountId, date, amount, description, cleanMerchant, categoryId, notes, isTransfer } = body;

    if (!accountId || !amount || !description) {
      return NextResponse.json({ error: "Account, amount, and description are required" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    const fingerprint = `manual_${accountId}_${new Date(date).toISOString()}_${numAmount}_${Math.random().toString(36).substring(2, 6)}`;

    const [created] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        accountId,
        date: new Date(date || Date.now()),
        amount: numAmount.toFixed(2),
        currency: "CAD",
        description,
        cleanMerchant: cleanMerchant || description,
        categoryId: categoryId || "other",
        notes: notes || null,
        fingerprint,
        isTransfer: isTransfer ?? false,
        userCategorized: true,
      })
      .returning();

    return NextResponse.json({ success: true, transaction: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
