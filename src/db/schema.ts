import { pgTable, text, timestamp, boolean, numeric, integer, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  timezone: text("timezone").default("America/Toronto").notNull(),
  language: text("language").default("en-CA").notNull(),
  currency: text("currency").default("CAD").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// User Settings
export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  budgetPeriod: text("budget_period").default("monthly").notNull(), // weekly, biweekly, monthly
  payCycle: text("pay_cycle").default("biweekly").notNull(), // weekly, biweekly, semimonthly, monthly
  warningThreshold1: integer("warning_threshold_1").default(75).notNull(),
  warningThreshold2: integer("warning_threshold_2").default(90).notNull(),
  notifyOnSyncFailure: boolean("notify_on_sync_failure").default(true).notNull(),
  notifyOnBudgetAlert: boolean("notify_on_budget_alert").default(true).notNull(),
  notifyOnIncomeExpected: boolean("notify_on_income_expected").default(true).notNull(),
  excludeTransfersFromSpending: boolean("exclude_transfers_from_spending").default(true).notNull(),
  privacyMode: boolean("privacy_mode").default(false).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Institutions (Canadian Banks like RBC, TD, Scotiabank, BMO, CIBC, Desjardins, Tangerine, EQ Bank, etc.)
export const institutions = pgTable("institutions", {
  id: text("id").primaryKey(), // e.g. "rbc", "td", "bmo", "scotia", "cibc", "tangerine", "desjardins", "eqbank", "wealthsimple"
  flinksInstitutionId: text("flinks_institution_id"),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#0f766e").notNull(),
  supportedProducts: text("supported_products").array(),
  isPopular: boolean("is_popular").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Flinks Provider Connections
export const providerConnections = pgTable("provider_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  institutionId: text("institution_id").references(() => institutions.id).notNull(),
  flinksLoginId: text("flinks_login_id").notNull(), // connection id in Flinks
  flinksRequestId: text("flinks_request_id"),
  status: text("status").default("active").notNull(), // active, degraded, disconnected, reauth_required, error
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSyncStatus: text("last_sync_status").default("success"), // success, failed, pending
  lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Financial Accounts
export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  connectionId: uuid("connection_id").references(() => providerConnections.id, { onDelete: "cascade" }),
  flinksAccountId: text("flinks_account_id"),
  accountNumberMask: text("account_number_mask").default("****").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // chequing, savings, credit_card, line_of_credit, loan, cash, manual_debt
  subtype: text("subtype"),
  currency: text("currency").default("CAD").notNull(),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  availableBalance: numeric("available_balance", { precision: 12, scale: 2 }),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
  isManual: boolean("is_manual").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncHealth: text("sync_health").default("healthy").notNull(), // healthy, warning, error
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Account Balance Snapshots
export const accountBalanceSnapshots = pgTable("account_balance_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "cascade" }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).defaultNow().notNull(),
});

// Transaction Categories
export const transactionCategories = pgTable("transaction_categories", {
  id: text("id").primaryKey(), // "income", "housing", "groceries", "restaurants", "transportation", etc.
  name: text("name").notNull(),
  group: text("group").notNull(), // income, fixed_expenses, variable_expenses, debt_savings, transfers
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isSystem: boolean("is_system").default(true).notNull(),
  isExcludedFromBudget: boolean("is_excluded_from_budget").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// Transactions
// Amount Convention: Negative = Money leaving account (Expense), Positive = Money entering account (Income/Credit)
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "cascade" }).notNull(),
  flinksTransactionId: text("flinks_transaction_id"),
  fingerprint: text("fingerprint").notNull(), // for duplicate detection
  date: timestamp("date", { withTimezone: true }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(), // - for expense, + for income
  currency: text("currency").default("CAD").notNull(),
  description: text("description").notNull(),
  cleanMerchant: text("clean_merchant").notNull(),
  categoryId: text("category_id").references(() => transactionCategories.id).notNull(),
  subCategory: text("sub_category"),
  isPending: boolean("is_pending").default(false).notNull(),
  isRecurringCandidate: boolean("is_recurring_candidate").default(false).notNull(),
  isIncomeCandidate: boolean("is_income_candidate").default(false).notNull(),
  isTransfer: boolean("is_transfer").default(false).notNull(),
  isRefund: boolean("is_refund").default(false).notNull(),
  notes: text("notes"),
  userCategorized: boolean("user_categorized").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("tx_user_date_idx").on(t.userId, t.date),
  index("tx_fingerprint_idx").on(t.fingerprint),
  index("tx_account_idx").on(t.accountId),
]);

// Merchant rules for automatic categorization
export const merchantRules = pgTable("merchant_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  merchantPattern: text("merchant_pattern").notNull(), // regex or substring matching
  targetCategoryId: text("target_category_id").references(() => transactionCategories.id).notNull(),
  targetCleanMerchant: text("target_clean_merchant"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Transaction Sync Runs
export const transactionSyncRuns = pgTable("transaction_sync_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  connectionId: uuid("connection_id").references(() => providerConnections.id, { onDelete: "cascade" }).notNull(),
  triggerSource: text("trigger_source").default("webhook").notNull(), // webhook, manual, scheduled
  status: text("status").default("pending").notNull(), // pending, in_progress, completed, failed
  transactionsAdded: integer("transactions_added").default(0).notNull(),
  transactionsUpdated: integer("transactions_updated").default(0).notNull(),
  transactionsDuplicate: integer("transactions_duplicate").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// Flinks Webhook Events
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: text("event_id").notNull().unique(), // idempotency key
  loginId: text("login_id").notNull(),
  eventType: text("event_type").notNull(), // OPERATION_PENDING, OPERATION_COMPLETED, REFRESH_COMPLETED, ERROR
  status: text("status").default("received").notNull(), // received, processing, completed, failed
  retryCount: integer("retry_count").default(0).notNull(),
  payload: jsonb("payload"),
  errorMessage: text("error_message"),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// Recurring Income / Expense Patterns
export const recurringPatterns = pgTable("recurring_patterns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Employer Payroll", "CRA GST/HST Credit", "Canada Child Benefit"
  type: text("type").default("income").notNull(), // income, expense
  frequency: text("frequency").notNull(), // weekly, biweekly, semimonthly, monthly, quarterly
  expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }).notNull(),
  isVariable: boolean("is_variable").default(false).notNull(),
  status: text("status").default("suggested").notNull(), // suggested, confirmed, rejected, manual
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }).default("0.85").notNull(),
  lastSeenDate: timestamp("last_seen_date", { withTimezone: true }),
  nextExpectedDate: timestamp("next_expected_date", { withTimezone: true }),
  merchantMatch: text("merchant_match").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Income Sources
export const incomeSources = pgTable("income_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  patternId: uuid("pattern_id").references(() => recurringPatterns.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  category: text("category").default("payroll").notNull(), // payroll, government_benefit, pension, freelance, rental, other
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").default("biweekly").notNull(),
  destinationAccountId: uuid("destination_account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Budgets
export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g. "October 2026 Budget"
  periodType: text("period_type").default("monthly").notNull(), // monthly, biweekly, weekly, custom
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  totalIncomeTarget: numeric("total_income_target", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalExpenseTarget: numeric("total_expense_target", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Budget Items (Category allocations)
export const budgetItems = pgTable("budget_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  budgetId: uuid("budget_id").references(() => budgets.id, { onDelete: "cascade" }).notNull(),
  categoryId: text("category_id").references(() => transactionCategories.id).notNull(),
  allocatedAmount: numeric("allocated_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  carryOverAmount: numeric("carry_over_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Financial Goals
export const financialGoals = pgTable("financial_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // emergency_fund, vacation, home_deposit, car, education, debt_payoff, general_savings
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  targetDate: timestamp("target_date", { withTimezone: true }),
  linkedAccountId: uuid("linked_account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
  monthlyContributionEstimate: numeric("monthly_contribution_estimate", { precision: 12, scale: 2 }),
  status: text("status").default("in_progress").notNull(), // in_progress, completed, paused, archived
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Goal Contributions
export const goalContributions = pgTable("goal_contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id").references(() => financialGoals.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  contributionDate: timestamp("contribution_date", { withTimezone: true }).defaultNow().notNull(),
  note: text("note"),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // sync_alert, budget_warning, income_incoming, goal_milestone, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // user_login, connection_created, webhook_received, sync_executed, category_updated, goal_updated
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
