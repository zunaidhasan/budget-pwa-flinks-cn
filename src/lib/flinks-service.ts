import { db } from "@/db";
import {
  institutions,
  providerConnections,
  financialAccounts,
  transactions,
  transactionSyncRuns,
  webhookEvents,
  recurringPatterns,
  merchantRules,
  notifications,
  auditLogs,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

export interface FlinksAccountRaw {
  Id: string;
  AccountNumber: string;
  Title: string;
  Type: string;
  Balance: {
    Current: number;
    Available?: number;
    Limit?: number;
  };
  Currency: string;
  Category?: string;
}

export interface FlinksTransactionRaw {
  Id: string;
  Date: string;
  Description: string;
  Debit?: number | null;
  Credit?: number | null;
  Balance?: number;
}

/**
 * Flinks Service handles bank integration:
 * - Generating connection credentials and Flinks Connect configuration
 * - Parsing and normalizing accounts & transactions
 * - Applying Canadian merchant cleaning rules
 * - Webhook processing with idempotency
 * - Recurring income pattern detection
 */
export class FlinksService {
  /**
   * Cleans raw Canadian banking strings into polished merchant names
   */
  static cleanMerchantName(description: string): { cleanName: string; detectedCategory: string } {
    const raw = description.toUpperCase();

    if (raw.includes("PAYROLL") || raw.includes("SALARY") || raw.includes("DIRECT DEP") || raw.includes("GOV")) {
      if (raw.includes("CANADA CHILD") || raw.includes("CCB")) return { cleanName: "Canada Child Benefit (CRA)", detectedCategory: "income" };
      if (raw.includes("GST") || raw.includes("HST")) return { cleanName: "CRA GST/HST Credit", detectedCategory: "income" };
      if (raw.includes("TECH SOLUTIONS") || raw.includes("SHOPIFY")) return { cleanName: "Shopify Payroll", detectedCategory: "income" };
      return { cleanName: "Employer Direct Deposit Payroll", detectedCategory: "income" };
    }

    if (raw.includes("LOBLAW") || raw.includes("NO FRILLS") || raw.includes("METRO") || raw.includes("SOBEYS") || raw.includes("COSTCO") || raw.includes("FARM BOY") || raw.includes("FOOD BASICS")) {
      if (raw.includes("COSTCO")) return { cleanName: "Costco Wholesale", detectedCategory: "groceries" };
      if (raw.includes("NO FRILLS")) return { cleanName: "No Frills Supermarket", detectedCategory: "groceries" };
      if (raw.includes("LOBLAW")) return { cleanName: "Loblaws", detectedCategory: "groceries" };
      if (raw.includes("METRO")) return { cleanName: "Metro Groceries", detectedCategory: "groceries" };
      if (raw.includes("SOBEYS")) return { cleanName: "Sobeys", detectedCategory: "groceries" };
      if (raw.includes("FARM BOY")) return { cleanName: "Farm Boy", detectedCategory: "groceries" };
      return { cleanName: "Supermarket & Groceries", detectedCategory: "groceries" };
    }

    if (raw.includes("TIM HORTON") || raw.includes("STARBUCKS") || raw.includes("MCDONALD") || raw.includes("UBER EATS") || raw.includes("DOORDASH") || raw.includes("SKIPTHEDISHES") || raw.includes("A&W")) {
      if (raw.includes("TIM HORTON")) return { cleanName: "Tim Hortons", detectedCategory: "restaurants" };
      if (raw.includes("STARBUCKS")) return { cleanName: "Starbucks", detectedCategory: "restaurants" };
      if (raw.includes("UBER EATS")) return { cleanName: "Uber Eats", detectedCategory: "restaurants" };
      if (raw.includes("DOORDASH")) return { cleanName: "DoorDash", detectedCategory: "restaurants" };
      return { cleanName: "Restaurant / Dining", detectedCategory: "restaurants" };
    }

    if (raw.includes("HYDRO") || raw.includes("ENBRIDGE") || raw.includes("ENMAX") || raw.includes("BC HYDRO")) {
      return { cleanName: "Hydro & Utilities", detectedCategory: "utilities" };
    }

    if (raw.includes("ROGERS") || raw.includes("BELL") || raw.includes("TELUS") || raw.includes("FIDO") || raw.includes("KOODO") || raw.includes("FREEDOM MOBILE")) {
      return { cleanName: "Telecom (Rogers / Bell / Telus)", detectedCategory: "phone_internet" };
    }

    if (raw.includes("PRESTO") || raw.includes("TTC") || raw.includes("PETRO") || raw.includes("ESSO") || raw.includes("SHELL") || raw.includes("TRANSIT") || raw.includes("UBER TRIP")) {
      if (raw.includes("PRESTO") || raw.includes("TTC")) return { cleanName: "Presto TTC Public Transit", detectedCategory: "transportation" };
      if (raw.includes("PETRO")) return { cleanName: "Petro-Canada", detectedCategory: "transportation" };
      if (raw.includes("ESSO")) return { cleanName: "Esso Gas Station", detectedCategory: "transportation" };
      if (raw.includes("SHELL")) return { cleanName: "Shell Gas Station", detectedCategory: "transportation" };
      return { cleanName: "Transit / Fuel", detectedCategory: "transportation" };
    }

    if (raw.includes("CAPREIT") || raw.includes("RENT") || raw.includes("MORTGAGE")) {
      return { cleanName: "Housing / Rent / Mortgage", detectedCategory: "housing" };
    }

    if (raw.includes("SHOPPERS") || raw.includes("REXALL") || raw.includes("PHARMACY")) {
      return { cleanName: "Shoppers Drug Mart / Pharmacy", detectedCategory: "healthcare" };
    }

    if (raw.includes("NETFLIX") || raw.includes("SPOTIFY") || raw.includes("CINEPLEX") || raw.includes("DISNEY")) {
      if (raw.includes("NETFLIX")) return { cleanName: "Netflix Canada", detectedCategory: "entertainment" };
      if (raw.includes("SPOTIFY")) return { cleanName: "Spotify", detectedCategory: "entertainment" };
      return { cleanName: "Streaming & Entertainment", detectedCategory: "entertainment" };
    }

    if (raw.includes("E-TRANSFER") || raw.includes("INTERAC")) {
      return { cleanName: "Interac e-Transfer", detectedCategory: "transfers" };
    }

    if (raw.includes("CANADIAN TIRE") || raw.includes("AMAZON") || raw.includes("WALMART") || raw.includes("WINNERS")) {
      return { cleanName: "Retail Shopping", detectedCategory: "shopping" };
    }

    // Default clean
    const cleaned = description.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    return { cleanName: cleaned || "Bank Transaction", detectedCategory: "other" };
  }

  /**
   * Generates duplicate prevention fingerprint
   */
  static generateFingerprint(accountId: string, date: Date, amount: string, description: string): string {
    const d = date.toISOString().split("T")[0];
    const data = `${accountId}_${d}_${parseFloat(amount).toFixed(2)}_${description.toLowerCase().trim()}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Sync accounts and transactions from Flinks payload or API response
   */
  static async syncConnectionData(
    userId: string,
    connectionId: string,
    rawAccounts: FlinksAccountRaw[],
    rawTransactionsByAccount: Record<string, FlinksTransactionRaw[]>,
    source: "webhook" | "manual" | "scheduled" = "manual"
  ) {
    const syncRun = await db
      .insert(transactionSyncRuns)
      .values({
        userId,
        connectionId,
        triggerSource: source,
        status: "in_progress",
      })
      .returning();

    let addedCount = 0;
    let duplicateCount = 0;
    let updatedCount = 0;

    try {
      // 1. Process Accounts
      for (const rawAcc of rawAccounts) {
        // Map account type
        let internalAccountType = "chequing";
        const typeLower = (rawAcc.Type || "").toLowerCase();
        if (typeLower.includes("saving")) internalAccountType = "savings";
        else if (typeLower.includes("credit") || typeLower.includes("card")) internalAccountType = "credit_card";
        else if (typeLower.includes("loc") || typeLower.includes("line")) internalAccountType = "line_of_credit";
        else if (typeLower.includes("loan")) internalAccountType = "loan";

        // Balance convention: credit cards should show negative liability if current balance is owed
        let currentBal = rawAcc.Balance.Current;
        if (internalAccountType === "credit_card" && currentBal > 0) {
          // In Flinks, credit card balances are often positive balances owed
          currentBal = -Math.abs(currentBal);
        }

        const existingAccount = await db
          .select()
          .from(financialAccounts)
          .where(and(eq(financialAccounts.connectionId, connectionId), eq(financialAccounts.flinksAccountId, rawAcc.Id)))
          .limit(1);

        let accountRecordId = "";

        if (existingAccount.length > 0) {
          accountRecordId = existingAccount[0].id;
          await db
            .update(financialAccounts)
            .set({
              name: rawAcc.Title || existingAccount[0].name,
              currentBalance: currentBal.toFixed(2),
              availableBalance: rawAcc.Balance.Available !== undefined ? rawAcc.Balance.Available.toFixed(2) : null,
              creditLimit: rawAcc.Balance.Limit !== undefined ? rawAcc.Balance.Limit.toFixed(2) : null,
              lastSyncAt: new Date(),
              syncHealth: "healthy",
              updatedAt: new Date(),
            })
            .where(eq(financialAccounts.id, accountRecordId));
          updatedCount++;
        } else {
          const [newAcc] = await db
            .insert(financialAccounts)
            .values({
              userId,
              connectionId,
              flinksAccountId: rawAcc.Id,
              accountNumberMask: rawAcc.AccountNumber ? rawAcc.AccountNumber.slice(-4) : "0000",
              name: rawAcc.Title || "Flinks Account",
              type: internalAccountType,
              subtype: rawAcc.Category || "default",
              currency: rawAcc.Currency || "CAD",
              currentBalance: currentBal.toFixed(2),
              availableBalance: rawAcc.Balance.Available !== undefined ? rawAcc.Balance.Available.toFixed(2) : null,
              creditLimit: rawAcc.Balance.Limit !== undefined ? rawAcc.Balance.Limit.toFixed(2) : null,
              syncHealth: "healthy",
              lastSyncAt: new Date(),
            })
            .returning();
          accountRecordId = newAcc.id;
        }

        // 2. Process Transactions for this account
        const accountTxs = rawTransactionsByAccount[rawAcc.Id] || [];

        // Fetch user's custom merchant rules for categorization
        const userRules = await db.select().from(merchantRules).where(eq(merchantRules.userId, userId));

        for (const rawTx of accountTxs) {
          // Canadian Budgeting Standard Amount Convention:
          // Negative (-) = money leaving user's account (Debit / Expense)
          // Positive (+) = money entering user's account (Credit / Income / Refund)
          let signedAmount = 0;
          if (rawTx.Credit !== null && rawTx.Credit !== undefined && rawTx.Credit > 0) {
            signedAmount = Math.abs(rawTx.Credit);
          } else if (rawTx.Debit !== null && rawTx.Debit !== undefined && rawTx.Debit > 0) {
            signedAmount = -Math.abs(rawTx.Debit);
          } else {
            // fallback
            signedAmount = 0;
          }

          const parsedDate = new Date(rawTx.Date || Date.now());
          const fingerprint = FlinksService.generateFingerprint(
            accountRecordId,
            parsedDate,
            signedAmount.toFixed(2),
            rawTx.Description || "tx"
          );

          // Check duplicate
          const existingTx = await db
            .select({ id: transactions.id })
            .from(transactions)
            .where(eq(transactions.fingerprint, fingerprint))
            .limit(1);

          if (existingTx.length > 0) {
            duplicateCount++;
            continue;
          }

          // Merchant & Category Analysis
          const { cleanName, detectedCategory } = FlinksService.cleanMerchantName(rawTx.Description || "");
          let finalCategory = detectedCategory;
          let finalCleanMerchant = cleanName;

          // Check if matches user rules
          for (const rule of userRules) {
            if (rawTx.Description.toUpperCase().includes(rule.merchantPattern.toUpperCase())) {
              finalCategory = rule.targetCategoryId;
              if (rule.targetCleanMerchant) {
                finalCleanMerchant = rule.targetCleanMerchant;
              }
              break;
            }
          }

          const isIncomeCandidate = signedAmount > 50 && (finalCategory === "income" || rawTx.Description.toUpperCase().includes("PAYROLL") || rawTx.Description.toUpperCase().includes("DIRECT DEP"));
          const isTransfer = finalCategory === "transfers" || rawTx.Description.toUpperCase().includes("TRANSFER") || rawTx.Description.toUpperCase().includes("E-TRANSFER");

          await db.insert(transactions).values({
            userId,
            accountId: accountRecordId,
            flinksTransactionId: rawTx.Id,
            fingerprint,
            date: parsedDate,
            amount: signedAmount.toFixed(2),
            currency: rawAcc.Currency || "CAD",
            description: rawTx.Description || "Flinks Transaction",
            cleanMerchant: finalCleanMerchant,
            categoryId: finalCategory,
            isPending: false,
            isIncomeCandidate,
            isRecurringCandidate: isIncomeCandidate || rawTx.Description.toUpperCase().includes("RENT") || rawTx.Description.toUpperCase().includes("BILL"),
            isTransfer,
          });

          addedCount++;
        }
      }

      // Update provider connection status
      await db
        .update(providerConnections)
        .set({
          status: "active",
          lastSyncAt: new Date(),
          lastSyncStatus: "success",
          lastErrorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(providerConnections.id, connectionId));

      // Complete sync run record
      await db
        .update(transactionSyncRuns)
        .set({
          status: "completed",
          transactionsAdded: addedCount,
          transactionsUpdated: updatedCount,
          transactionsDuplicate: duplicateCount,
          completedAt: new Date(),
        })
        .where(eq(transactionSyncRuns.id, syncRun[0].id));

      // Run recurring income heuristic detector
      await FlinksService.detectRecurringIncome(userId);

      // Audit log
      await db.insert(auditLogs).values({
        userId,
        action: "sync_executed",
        details: `Connection ${connectionId} synced successfully via ${source}. ${addedCount} added, ${duplicateCount} duplicate, ${updatedCount} updated.`,
      });

      return {
        success: true,
        addedCount,
        duplicateCount,
        updatedCount,
      };
    } catch (err: any) {
      await db
        .update(transactionSyncRuns)
        .set({
          status: "failed",
          errorMessage: err.message || "Unknown sync error",
          completedAt: new Date(),
        })
        .where(eq(transactionSyncRuns.id, syncRun[0].id));

      await db
        .update(providerConnections)
        .set({
          status: "error",
          lastSyncStatus: "failed",
          lastErrorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(providerConnections.id, connectionId));

      throw err;
    }
  }

  /**
   * Recurring Income Pattern Detection Engine
   * Analyzes credits > $100 looking for recurring intervals:
   * - Bi-weekly (~13 to 16 days)
   * - Monthly (~27 to 32 days)
   * - Semi-monthly (~14 to 17 days, mid-month and month-end)
   * - Weekly (~6 to 8 days)
   */
  static async detectRecurringIncome(userId: string) {
    const incomeTransactions = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), sql`cast(${transactions.amount} as numeric) > 100`))
      .orderBy(desc(transactions.date));

    // Group transactions by normalized merchant pattern
    const groups: Record<string, typeof incomeTransactions> = {};
    for (const tx of incomeTransactions) {
      const key = tx.cleanMerchant.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    }

    for (const [key, txList] of Object.entries(groups)) {
      if (txList.length >= 2) {
        // Compute intervals in days
        const sorted = [...txList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const intervals: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const diffDays = Math.round(
            (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 3600 * 24)
          );
          intervals.push(diffDays);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        let detectedFrequency = "monthly";
        let confidence = 0.8;

        if (avgInterval >= 12 && avgInterval <= 16) {
          detectedFrequency = "biweekly";
          confidence = 0.94;
        } else if (avgInterval >= 6 && avgInterval <= 8) {
          detectedFrequency = "weekly";
          confidence = 0.92;
        } else if (avgInterval >= 26 && avgInterval <= 33) {
          detectedFrequency = "monthly";
          confidence = 0.95;
        } else if (avgInterval >= 14 && avgInterval <= 17) {
          detectedFrequency = "semimonthly";
          confidence = 0.88;
        }

        const latestTx = sorted[sorted.length - 1];
        const lastSeen = new Date(latestTx.date);
        let nextDate = new Date(lastSeen);

        if (detectedFrequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        else if (detectedFrequency === "biweekly") nextDate.setDate(nextDate.getDate() + 14);
        else if (detectedFrequency === "semimonthly") nextDate.setDate(nextDate.getDate() + 15);
        else if (detectedFrequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

        // Check if pattern already exists
        const existingPattern = await db
          .select()
          .from(recurringPatterns)
          .where(and(eq(recurringPatterns.userId, userId), eq(recurringPatterns.merchantMatch, latestTx.cleanMerchant)))
          .limit(1);

        if (existingPattern.length === 0) {
          await db.insert(recurringPatterns).values({
            userId,
            accountId: latestTx.accountId,
            name: `${latestTx.cleanMerchant} (${detectedFrequency.toUpperCase()})`,
            type: "income",
            frequency: detectedFrequency,
            expectedAmount: latestTx.amount,
            isVariable: false,
            status: "suggested",
            confidenceScore: confidence.toFixed(2),
            lastSeenDate: lastSeen,
            nextExpectedDate: nextDate,
            merchantMatch: latestTx.cleanMerchant,
          });

          // In-app alert
          await db.insert(notifications).values({
            userId,
            type: "income_incoming",
            title: `New Recurring Income Detected: ${latestTx.cleanMerchant}`,
            message: `Identified ${detectedFrequency} income pattern of $${latestTx.amount} CAD. Review and confirm to track in your budget forecasts.`,
          });
        }
      }
    }
  }

  /**
   * Processes a Flinks Webhook Event idempotently
   */
  static async handleWebhook(payload: any, signatureHeader?: string) {
    const eventId = payload.EventId || payload.RequestId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const loginId = payload.LoginId || payload.loginId || "unknown_login";
    const eventType = payload.EventType || payload.Type || "OPERATION_COMPLETED";

    // 1. Check idempotency
    const existing = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      return { status: "duplicate_skipped", eventId };
    }

    // 2. Log receipt
    const [webhookRecord] = await db
      .insert(webhookEvents)
      .values({
        eventId,
        loginId,
        eventType,
        status: "processing",
        payload,
      })
      .returning();

    try {
      // Find matching connection
      const connection = await db
        .select()
        .from(providerConnections)
        .where(eq(providerConnections.flinksLoginId, loginId))
        .limit(1);

      if (connection.length > 0) {
        const conn = connection[0];

        if (eventType === "OPERATION_COMPLETED" || eventType === "REFRESH_COMPLETED") {
          // If accounts and transactions payload is provided
          const accounts: FlinksAccountRaw[] = payload.Accounts || [];
          const txsByAcc: Record<string, FlinksTransactionRaw[]> = {};

          if (accounts.length > 0) {
            for (const acc of accounts) {
              txsByAcc[acc.Id] = (payload.Transactions && payload.Transactions[acc.Id]) || [];
            }
            await FlinksService.syncConnectionData(conn.userId, conn.id, accounts, txsByAcc, "webhook");
          } else {
            // Touch sync time
            await db
              .update(providerConnections)
              .set({
                lastSyncAt: new Date(),
                lastSyncStatus: "success",
                updatedAt: new Date(),
              })
              .where(eq(providerConnections.id, conn.id));
          }
        } else if (eventType === "ERROR" || eventType === "AUTHENTICATION_FAILED") {
          await db
            .update(providerConnections)
            .set({
              status: "reauth_required",
              lastSyncStatus: "failed",
              lastErrorMessage: payload.ErrorMessage || "Provider re-authentication required",
              updatedAt: new Date(),
            })
            .where(eq(providerConnections.id, conn.id));

          await db.insert(notifications).values({
            userId: conn.userId,
            type: "sync_alert",
            title: "Bank Re-authentication Required",
            message: `Connection for your institution requires security verification. Please reconnect using Flinks.`,
          });
        }
      }

      await db
        .update(webhookEvents)
        .set({
          status: "completed",
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, webhookRecord.id));

      return { status: "processed", eventId };
    } catch (err: any) {
      await db
        .update(webhookEvents)
        .set({
          status: "failed",
          errorMessage: err.message,
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, webhookRecord.id));
      throw err;
    }
  }

  /**
   * Generates mock realistic Canadian institution accounts & recent transactions
   * for demonstration and testing of full Flinks Connect workflow
   */
  static generateMockCanadianData(institutionId: string, institutionName: string) {
    const accId1 = `flinks_${institutionId}_cheq_${Date.now()}`;
    const accId2 = `flinks_${institutionId}_sav_${Date.now()}`;
    const accId3 = `flinks_${institutionId}_visa_${Date.now()}`;

    const rawAccounts: FlinksAccountRaw[] = [
      {
        Id: accId1,
        AccountNumber: "4028491823",
        Title: `${institutionName} Everyday Chequing`,
        Type: "chequing",
        Category: "primary_chequing",
        Balance: {
          Current: 3820.75,
          Available: 3820.75,
        },
        Currency: "CAD",
      },
      {
        Id: accId2,
        AccountNumber: "9918204911",
        Title: `${institutionName} High Interest e-Savings`,
        Type: "savings",
        Category: "savings",
        Balance: {
          Current: 8500.0,
          Available: 8500.0,
        },
        Currency: "CAD",
      },
      {
        Id: accId3,
        AccountNumber: "450091827364",
        Title: `${institutionName} CashBack Visa`,
        Type: "credit_card",
        Category: "credit",
        Balance: {
          Current: 840.6,
          Available: 4159.4,
          Limit: 5000.0,
        },
        Currency: "CAD",
      },
    ];

    const now = Date.now();
    const dStr = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();

    const rawTransactions: Record<string, FlinksTransactionRaw[]> = {
      [accId1]: [
        {
          Id: `fl_tx_${Date.now()}_1`,
          Date: dStr(1),
          Description: "PAYROLL TECH CORP CANADA DIR DEP",
          Credit: 2450.0,
          Debit: 0,
        },
        {
          Id: `fl_tx_${Date.now()}_2`,
          Date: dStr(3),
          Description: "PRE-AUTH DEBIT BOARDWALK APTS RENT",
          Credit: 0,
          Debit: 1825.0,
        },
        {
          Id: `fl_tx_${Date.now()}_3`,
          Date: dStr(6),
          Description: "HYDRO ONE UTILITY PMT",
          Credit: 0,
          Debit: 88.4,
        },
        {
          Id: `fl_tx_${Date.now()}_4`,
          Date: dStr(8),
          Description: "BELL CANADA MOBILITY BILL",
          Credit: 0,
          Debit: 75.0,
        },
      ],
      [accId3]: [
        {
          Id: `fl_tx_${Date.now()}_5`,
          Date: dStr(0),
          Description: "LOBLAWS SUPERSTORE #1948 TORONTO",
          Credit: 0,
          Debit: 135.2,
        },
        {
          Id: `fl_tx_${Date.now()}_6`,
          Date: dStr(2),
          Description: "TIM HORTONS QUEEN ST",
          Credit: 0,
          Debit: 6.85,
        },
        {
          Id: `fl_tx_${Date.now()}_7`,
          Date: dStr(4),
          Description: "PETRO-CANADA HIGHWAY 401",
          Credit: 0,
          Debit: 68.5,
        },
        {
          Id: `fl_tx_${Date.now()}_8`,
          Date: dStr(5),
          Description: "SHOPPERS DRUG MART 0823",
          Credit: 0,
          Debit: 34.15,
        },
        {
          Id: `fl_tx_${Date.now()}_9`,
          Date: dStr(9),
          Description: "NETFLIX CAD SUBSCRIPTION",
          Credit: 0,
          Debit: 20.99,
        },
      ],
      [accId2]: [
        {
          Id: `fl_tx_${Date.now()}_10`,
          Date: dStr(15),
          Description: "INTEREST PAID DEPOSIT",
          Credit: 28.33,
          Debit: 0,
        },
      ],
    };

    return { rawAccounts, rawTransactions };
  }
}
