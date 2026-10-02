import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { transactions, merchantRules } from "@/db/schema";
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
    const { categoryId, notes, isTransfer, createMerchantRule } = body;

    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updateFields: any = {
      userCategorized: true,
      updatedAt: new Date(),
    };

    if (categoryId !== undefined) updateFields.categoryId = categoryId;
    if (notes !== undefined) updateFields.notes = notes;
    if (isTransfer !== undefined) updateFields.isTransfer = isTransfer;

    const [updated] = await db
      .update(transactions)
      .set(updateFields)
      .where(eq(transactions.id, id))
      .returning();

    // If user asked to "Always categorize this merchant as..."
    if (createMerchantRule && categoryId) {
      const merchantName = existing[0].cleanMerchant || existing[0].description;
      await db.insert(merchantRules).values({
        userId: user.id,
        merchantPattern: merchantName.slice(0, 30),
        targetCategoryId: categoryId,
        targetCleanMerchant: merchantName,
      });

      // Also bulk update all past transactions from same merchant
      await db
        .update(transactions)
        .set({ categoryId, userCategorized: true })
        .where(
          and(
            eq(transactions.userId, user.id),
            eq(transactions.cleanMerchant, existing[0].cleanMerchant)
          )
        );
    }

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
