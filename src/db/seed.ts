import { db } from "./index";
import {
  institutions,
  transactionCategories,
  users,
  userSettings,
  providerConnections,
  financialAccounts,
  transactions,
  recurringPatterns,
  incomeSources,
  budgets,
  budgetItems,
  financialGoals,
  goalContributions,
  notifications,
  merchantRules,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export const CANADIAN_INSTITUTIONS = [
  {
    id: "rbc",
    name: "Royal Bank of Canada (RBC)",
    shortName: "RBC",
    primaryColor: "#0051a5",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "credit_card", "line_of_credit", "mortgage"],
    isPopular: true,
  },
  {
    id: "td",
    name: "TD Canada Trust",
    shortName: "TD",
    primaryColor: "#008a00",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "credit_card", "loans", "investments"],
    isPopular: true,
  },
  {
    id: "scotia",
    name: "Scotiabank",
    shortName: "Scotiabank",
    primaryColor: "#ec111a",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "credit_card", "scene_plus"],
    isPopular: true,
  },
  {
    id: "bmo",
    name: "BMO Bank of Montreal",
    shortName: "BMO",
    primaryColor: "#0079c1",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "mastercard"],
    isPopular: true,
  },
  {
    id: "cibc",
    name: "CIBC",
    shortName: "CIBC",
    primaryColor: "#c41f3e",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "aventura", "aeroplan"],
    isPopular: true,
  },
  {
    id: "desjardins",
    name: "Desjardins",
    shortName: "Desjardins",
    primaryColor: "#008751",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "visadesjardins"],
    isPopular: true,
  },
  {
    id: "tangerine",
    name: "Tangerine Bank",
    shortName: "Tangerine",
    primaryColor: "#ea7024",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "money_back_card"],
    isPopular: true,
  },
  {
    id: "eqbank",
    name: "EQ Bank",
    shortName: "EQ Bank",
    primaryColor: "#1d2327",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["savings", "chequing", "gics"],
    isPopular: true,
  },
  {
    id: "wealthsimple",
    name: "Wealthsimple Cash",
    shortName: "Wealthsimple",
    primaryColor: "#333333",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["cash", "chequing", "crypto"],
    isPopular: true,
  },
  {
    id: "national_bank",
    name: "National Bank of Canada",
    shortName: "NBC",
    primaryColor: "#e31837",
    logoUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80",
    supportedProducts: ["chequing", "savings", "mastercard"],
    isPopular: false,
  },
];

export const CATEGORIES = [
  { id: "income", name: "Income & Payroll", group: "income", icon: "Briefcase", color: "#10b981", sortOrder: 1 },
  { id: "housing", name: "Housing & Rent", group: "fixed_expenses", icon: "Home", color: "#6366f1", sortOrder: 2 },
  { id: "groceries", name: "Groceries", group: "variable_expenses", icon: "ShoppingCart", color: "#14b8a6", sortOrder: 3 },
  { id: "restaurants", name: "Dining & Restaurants", group: "variable_expenses", icon: "Coffee", color: "#f59e0b", sortOrder: 4 },
  { id: "transportation", name: "Transit & Gas", group: "variable_expenses", icon: "Car", color: "#3b82f6", sortOrder: 5 },
  { id: "utilities", name: "Utilities & Hydro", group: "fixed_expenses", icon: "Zap", color: "#8b5cf6", sortOrder: 6 },
  { id: "phone_internet", name: "Phone & Internet", group: "fixed_expenses", icon: "Wifi", color: "#06b6d4", sortOrder: 7 },
  { id: "insurance", name: "Insurance", group: "fixed_expenses", icon: "Shield", color: "#64748b", sortOrder: 8 },
  { id: "healthcare", name: "Health & Pharmacy", group: "variable_expenses", icon: "HeartPulse", color: "#ec4899", sortOrder: 9 },
  { id: "shopping", name: "Shopping & Goods", group: "variable_expenses", icon: "ShoppingBag", color: "#f43f5e", sortOrder: 10 },
  { id: "entertainment", name: "Entertainment & Subs", group: "variable_expenses", icon: "Film", color: "#a855f7", sortOrder: 11 },
  { id: "debt_repayment", name: "Debt Repayment", group: "debt_savings", icon: "CreditCard", color: "#ef4444", sortOrder: 12 },
  { id: "savings_goals", name: "Savings & Investments", group: "debt_savings", icon: "PiggyBank", color: "#22c55e", sortOrder: 13 },
  { id: "bank_fees", name: "Bank & Service Fees", group: "variable_expenses", icon: "AlertCircle", color: "#78716c", sortOrder: 14 },
  { id: "transfers", name: "Internal Transfers", group: "transfers", icon: "ArrowLeftRight", color: "#94a3b8", isExcludedFromBudget: true, sortOrder: 15 },
  { id: "taxes", name: "Taxes & Levies", group: "variable_expenses", icon: "FileText", color: "#d97706", sortOrder: 16 },
  { id: "other", name: "Miscellaneous", group: "variable_expenses", icon: "MoreHorizontal", color: "#9ca3af", sortOrder: 17 },
];

export async function seedDatabase() {
  // 1. Seed Institutions
  for (const inst of CANADIAN_INSTITUTIONS) {
    await db
      .insert(institutions)
      .values(inst)
      .onConflictDoUpdate({
        target: institutions.id,
        set: inst,
      });
  }

  // 2. Seed Categories
  for (const cat of CATEGORIES) {
    await db
      .insert(transactionCategories)
      .values({
        id: cat.id,
        name: cat.name,
        group: cat.group,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        isExcludedFromBudget: cat.isExcludedFromBudget ?? false,
      })
      .onConflictDoUpdate({
        target: transactionCategories.id,
        set: {
          name: cat.name,
          group: cat.group,
          icon: cat.icon,
          color: cat.color,
          sortOrder: cat.sortOrder,
          isExcludedFromBudget: cat.isExcludedFromBudget ?? false,
        },
      });
  }

  // Check if default Canadian user exists
  const defaultEmail = "alex.tremblay@example.ca";
  const existingUser = await db.select().from(users).where(eq(users.email, defaultEmail)).limit(1);

  if (existingUser.length > 0) {
    return { status: "already_seeded", userId: existingUser[0].id };
  }

  // 3. Create demo user
  const passwordHash = await bcrypt.hash("MapleLeaf2026!", 10);
  const [user] = await db
    .insert(users)
    .values({
      email: defaultEmail,
      name: "Alex Tremblay",
      passwordHash,
      timezone: "America/Toronto",
      language: "en-CA",
      currency: "CAD",
    })
    .returning();

  // 4. Create user settings
  await db.insert(userSettings).values({
    userId: user.id,
    budgetPeriod: "monthly",
    payCycle: "biweekly",
    warningThreshold1: 75,
    warningThreshold2: 90,
    notifyOnSyncFailure: true,
    notifyOnBudgetAlert: true,
    notifyOnIncomeExpected: true,
    excludeTransfersFromSpending: true,
    privacyMode: false,
  });

  // 5. Create Flinks Connection for RBC & Tangerine
  const [rbcConnection] = await db
    .insert(providerConnections)
    .values({
      userId: user.id,
      institutionId: "rbc",
      flinksLoginId: "flinks_login_ca_rbc_98214a",
      flinksRequestId: "req_flinks_rbc_init_8723",
      status: "active",
      lastSyncAt: new Date(),
      lastSyncStatus: "success",
    })
    .returning();

  const [tangerineConnection] = await db
    .insert(providerConnections)
    .values({
      userId: user.id,
      institutionId: "tangerine",
      flinksLoginId: "flinks_login_ca_tang_44108b",
      flinksRequestId: "req_flinks_tang_init_1993",
      status: "active",
      lastSyncAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      lastSyncStatus: "success",
    })
    .returning();

  // 6. Create Accounts
  const [chequing] = await db
    .insert(financialAccounts)
    .values({
      userId: user.id,
      connectionId: rbcConnection.id,
      flinksAccountId: "flinks_acc_rbc_cheq_001",
      accountNumberMask: "4829",
      name: "RBC Day to Day Banking",
      type: "chequing",
      subtype: "checking",
      currency: "CAD",
      currentBalance: "4850.45",
      availableBalance: "4850.45",
      syncHealth: "healthy",
      lastSyncAt: new Date(),
    })
    .returning();

  const [visa] = await db
    .insert(financialAccounts)
    .values({
      userId: user.id,
      connectionId: rbcConnection.id,
      flinksAccountId: "flinks_acc_rbc_visa_002",
      accountNumberMask: "9102",
      name: "RBC Avion Visa Infinite",
      type: "credit_card",
      subtype: "credit",
      currency: "CAD",
      currentBalance: "-1240.80",
      availableBalance: "8759.20",
      creditLimit: "10000.00",
      syncHealth: "healthy",
      lastSyncAt: new Date(),
    })
    .returning();

  const [tangSavings] = await db
    .insert(financialAccounts)
    .values({
      userId: user.id,
      connectionId: tangerineConnection.id,
      flinksAccountId: "flinks_acc_tang_sav_003",
      accountNumberMask: "3051",
      name: "Tangerine High Interest Savings",
      type: "savings",
      subtype: "high_yield_savings",
      currency: "CAD",
      currentBalance: "14250.00",
      availableBalance: "14250.00",
      syncHealth: "healthy",
      lastSyncAt: new Date(Date.now() - 3600000 * 4),
    })
    .returning();

  // 7. Seed Canadian Transactions (amount convention: - expense, + income)
  const now = new Date();
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const demoTxs = [
    // Income
    {
      accountId: chequing.id,
      date: d(2),
      amount: "2840.50",
      description: "DIRECT DEP TECH SOLUTIONS INC PAYROLL",
      cleanMerchant: "Shopify Tech Payroll",
      categoryId: "income",
      isIncomeCandidate: true,
      isRecurringCandidate: true,
      notes: "Bi-weekly salary direct deposit",
    },
    {
      accountId: chequing.id,
      date: d(16),
      amount: "2840.50",
      description: "DIRECT DEP TECH SOLUTIONS INC PAYROLL",
      cleanMerchant: "Shopify Tech Payroll",
      categoryId: "income",
      isIncomeCandidate: true,
      isRecurringCandidate: true,
      notes: "Bi-weekly salary direct deposit",
    },
    {
      accountId: chequing.id,
      date: d(8),
      amount: "185.00",
      description: "E-TRANSFER RECEIVED - EMILY SMITH INTERAC",
      cleanMerchant: "Emily Smith (Interac)",
      categoryId: "income",
      isIncomeCandidate: false,
      notes: "Cottage weekend split",
    },
    {
      accountId: chequing.id,
      date: d(20),
      amount: "320.00",
      description: "CANADA CHILD BENEFIT / CRA FED-PROV",
      cleanMerchant: "Canada Revenue Agency (CCB)",
      categoryId: "income",
      isIncomeCandidate: true,
      isRecurringCandidate: true,
      notes: "Monthly federal benefit",
    },

    // Housing & Utilities
    {
      accountId: chequing.id,
      date: d(5),
      amount: "-1950.00",
      description: "PRE-AUTH DEBIT CAPREIT RESIDENTIAL RENT",
      cleanMerchant: "CAPREIT Rent",
      categoryId: "housing",
      isRecurringCandidate: true,
    },
    {
      accountId: chequing.id,
      date: d(11),
      amount: "-94.30",
      description: "TORONTO HYDRO ELEC BILL PAYMENT",
      cleanMerchant: "Toronto Hydro",
      categoryId: "utilities",
      isRecurringCandidate: true,
    },
    {
      accountId: chequing.id,
      date: d(12),
      amount: "-78.50",
      description: "ROGERS COMM BILL 2894192",
      cleanMerchant: "Rogers Internet & Mobile",
      categoryId: "phone_internet",
      isRecurringCandidate: true,
    },

    // Groceries (Canadian stores)
    {
      accountId: visa.id,
      date: d(1),
      amount: "-148.65",
      description: "LOBLAWS #1043 TORONTO ON",
      cleanMerchant: "Loblaws",
      categoryId: "groceries",
    },
    {
      accountId: visa.id,
      date: d(4),
      amount: "-64.20",
      description: "NO FRILLS #392 QUEEN ST W",
      cleanMerchant: "No Frills",
      categoryId: "groceries",
    },
    {
      accountId: visa.id,
      date: d(9),
      amount: "-210.45",
      description: "COSTCO WHOLESALE W128 MISSISSAUGA",
      cleanMerchant: "Costco Wholesale",
      categoryId: "groceries",
    },
    {
      accountId: visa.id,
      date: d(14),
      amount: "-53.10",
      description: "METRO #448 TORONTO ON",
      cleanMerchant: "Metro Supermarket",
      categoryId: "groceries",
    },

    // Dining & Coffee
    {
      accountId: visa.id,
      date: d(1),
      amount: "-5.45",
      description: "TIM HORTONS #4928 TORONTO ON",
      cleanMerchant: "Tim Hortons",
      categoryId: "restaurants",
    },
    {
      accountId: visa.id,
      date: d(3),
      amount: "-46.80",
      description: "RAMEN ISSHIN COLLEGE ST TORONTO",
      cleanMerchant: "Ramen Isshin",
      categoryId: "restaurants",
    },
    {
      accountId: visa.id,
      date: d(6),
      amount: "-32.50",
      description: "UBER EATS CA*TORONTO ON",
      cleanMerchant: "Uber Eats",
      categoryId: "restaurants",
    },
    {
      accountId: visa.id,
      date: d(10),
      amount: "-7.15",
      description: "STARBUCKS #19488 TORONTO ON",
      cleanMerchant: "Starbucks Canada",
      categoryId: "restaurants",
    },

    // Transit & Gas
    {
      accountId: visa.id,
      date: d(2),
      amount: "-3.35",
      description: "PRESTO TAP TTC FARE TORONTO ON",
      cleanMerchant: "TTC Presto Transit",
      categoryId: "transportation",
    },
    {
      accountId: visa.id,
      date: d(7),
      amount: "-65.00",
      description: "PETRO-CANADA 9481 TORONTO ON",
      cleanMerchant: "Petro-Canada",
      categoryId: "transportation",
    },

    // Shopping & Health
    {
      accountId: visa.id,
      date: d(6),
      amount: "-42.99",
      description: "SHOPPERS DRUG MART #1029",
      cleanMerchant: "Shoppers Drug Mart",
      categoryId: "healthcare",
    },
    {
      accountId: visa.id,
      date: d(13),
      amount: "-89.95",
      description: "CANADIAN TIRE #042 TORONTO",
      cleanMerchant: "Canadian Tire",
      categoryId: "shopping",
    },

    // Entertainment
    {
      accountId: visa.id,
      date: d(7),
      amount: "-22.99",
      description: "NETFLIX.COM CAD MONTHLY",
      cleanMerchant: "Netflix Canada",
      categoryId: "entertainment",
      isRecurringCandidate: true,
    },
    {
      accountId: visa.id,
      date: d(15),
      amount: "-16.99",
      description: "SPOTIFY MUSIC CAD MONTHLY",
      cleanMerchant: "Spotify Canada",
      categoryId: "entertainment",
      isRecurringCandidate: true,
    },

    // Internal Transfers
    {
      accountId: chequing.id,
      date: d(3),
      amount: "-500.00",
      description: "TRANSFER TO TANGERINE SAVINGS #3051",
      cleanMerchant: "Transfer to Savings",
      categoryId: "transfers",
      isTransfer: true,
    },
    {
      accountId: tangSavings.id,
      date: d(3),
      amount: "500.00",
      description: "TRANSFER FROM RBC CHEQUING #4829",
      cleanMerchant: "Transfer from Chequing",
      categoryId: "transfers",
      isTransfer: true,
    },
  ];

  for (const tx of demoTxs) {
    const fingerprint = `tx_${tx.accountId}_${tx.date.toISOString().split("T")[0]}_${tx.amount}_${tx.description.slice(0, 15)}`;
    await db.insert(transactions).values({
      userId: user.id,
      accountId: tx.accountId,
      flinksTransactionId: `flinks_${Math.random().toString(36).substring(2, 10)}`,
      fingerprint,
      date: tx.date,
      amount: tx.amount,
      currency: "CAD",
      description: tx.description,
      cleanMerchant: tx.cleanMerchant,
      categoryId: tx.categoryId,
      isPending: false,
      isRecurringCandidate: tx.isRecurringCandidate ?? false,
      isIncomeCandidate: tx.isIncomeCandidate ?? false,
      isTransfer: tx.isTransfer ?? false,
      notes: tx.notes ?? null,
      userCategorized: false,
    });
  }

  // 8. Recurring Income Patterns
  const [payrollPattern] = await db
    .insert(recurringPatterns)
    .values({
      userId: user.id,
      accountId: chequing.id,
      name: "Shopify Tech Bi-Weekly Payroll",
      type: "income",
      frequency: "biweekly",
      expectedAmount: "2840.50",
      isVariable: false,
      status: "confirmed",
      confidenceScore: "0.98",
      lastSeenDate: d(2),
      nextExpectedDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // in 12 days
      merchantMatch: "TECH SOLUTIONS INC PAYROLL",
    })
    .returning();

  await db.insert(recurringPatterns).values({
    userId: user.id,
    accountId: chequing.id,
    name: "Canada Child Benefit (CRA)",
    type: "income",
    frequency: "monthly",
    expectedAmount: "320.00",
    isVariable: false,
    status: "confirmed",
    confidenceScore: "0.95",
    lastSeenDate: d(20),
    nextExpectedDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    merchantMatch: "CANADA CHILD BENEFIT",
  });

  await db.insert(recurringPatterns).values({
    userId: user.id,
    accountId: chequing.id,
    name: "Interac e-Transfer Emily Smith",
    type: "income",
    frequency: "monthly",
    expectedAmount: "185.00",
    isVariable: true,
    status: "suggested", // user review candidate
    confidenceScore: "0.72",
    lastSeenDate: d(8),
    nextExpectedDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
    merchantMatch: "EMILY SMITH INTERAC",
  });

  // 9. Income Sources
  await db.insert(incomeSources).values({
    userId: user.id,
    patternId: payrollPattern.id,
    name: "Primary Employment - Software Engineer",
    category: "payroll",
    amount: "2840.50",
    frequency: "biweekly",
    destinationAccountId: chequing.id,
    isActive: true,
    notes: "Main employer paycheque deposited every second Thursday",
  });

  // 10. Budget for current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [currentBudget] = await db
    .insert(budgets)
    .values({
      userId: user.id,
      name: `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()} Budget`,
      periodType: "monthly",
      startDate: startOfMonth,
      endDate: endOfMonth,
      totalIncomeTarget: "6000.00",
      totalExpenseTarget: "4200.00",
    })
    .returning();

  // Category allocations for budget
  const categoryAllocations = [
    { catId: "housing", amount: "1950.00" },
    { catId: "groceries", amount: "650.00" },
    { catId: "restaurants", amount: "300.00" },
    { catId: "transportation", amount: "200.00" },
    { catId: "utilities", amount: "150.00" },
    { catId: "phone_internet", amount: "90.00" },
    { catId: "entertainment", amount: "100.00" },
    { catId: "shopping", amount: "200.00" },
    { catId: "healthcare", amount: "80.00" },
    { catId: "savings_goals", amount: "600.00" },
  ];

  for (const item of categoryAllocations) {
    await db.insert(budgetItems).values({
      budgetId: currentBudget.id,
      categoryId: item.catId,
      allocatedAmount: item.amount,
      carryOverAmount: "0.00",
    });
  }

  // 11. Financial Goals
  const [goal1] = await db
    .insert(financialGoals)
    .values({
      userId: user.id,
      title: "6-Month Emergency Fund",
      type: "emergency_fund",
      targetAmount: "18000.00",
      currentAmount: "14250.00",
      targetDate: new Date(now.getFullYear(), now.getMonth() + 5, 1),
      linkedAccountId: tangSavings.id,
      monthlyContributionEstimate: "750.00",
      status: "in_progress",
      notes: "Held in Tangerine High Interest Savings Account at 4.25%",
    })
    .returning();

  await db.insert(goalContributions).values({
    goalId: goal1.id,
    amount: "500.00",
    contributionDate: d(3),
    note: "Automated monthly savings transfer",
  });

  const [goal2] = await db
    .insert(financialGoals)
    .values({
      userId: user.id,
      title: "Banff Summer Vacation",
      type: "vacation",
      targetAmount: "2500.00",
      currentAmount: "1200.00",
      targetDate: new Date(now.getFullYear(), 6, 15),
      monthlyContributionEstimate: "325.00",
      status: "in_progress",
      notes: "Trip to Rocky Mountains - flights & Parks Canada passes",
    })
    .returning();

  await db.insert(goalContributions).values({
    goalId: goal2.id,
    amount: "300.00",
    contributionDate: d(12),
    note: "Side project payout allocation",
  });

  // 12. Merchant categorization rules
  await db.insert(merchantRules).values([
    {
      userId: user.id,
      merchantPattern: "LOBLAWS",
      targetCategoryId: "groceries",
      targetCleanMerchant: "Loblaws",
    },
    {
      userId: user.id,
      merchantPattern: "TIM HORTONS",
      targetCategoryId: "restaurants",
      targetCleanMerchant: "Tim Hortons",
    },
    {
      userId: user.id,
      merchantPattern: "PETRO-CANADA",
      targetCategoryId: "transportation",
      targetCleanMerchant: "Petro-Canada",
    },
  ]);

  // 13. Notifications
  await db.insert(notifications).values([
    {
      userId: user.id,
      type: "income_incoming",
      title: "Expected Payroll in 12 Days",
      message: "Shopify Tech Bi-Weekly Payroll ($2,840.50 CAD) is scheduled for deposit on your RBC Chequing account.",
      isRead: false,
    },
    {
      userId: user.id,
      type: "budget_warning",
      title: "Groceries at 73% of Budget",
      message: "You have spent $473.40 of your $650.00 Groceries budget. 14 days remaining in period.",
      isRead: false,
    },
    {
      userId: user.id,
      type: "sync_alert",
      title: "Flinks Sync Successful",
      message: "RBC and Tangerine synchronized cleanly. 22 new transactions normalized with zero duplicates.",
      isRead: true,
    },
  ]);

  return { status: "seeded_successfully", userId: user.id };
}
