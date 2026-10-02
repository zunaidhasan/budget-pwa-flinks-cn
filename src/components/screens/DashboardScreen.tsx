"use client";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Plus,
  PiggyBank,
} from "lucide-react";
import { formatCad } from "@/lib/utils";

interface DashboardScreenProps {
  data: any;
  onRefresh: () => void;
  onOpenConnect: () => void;
  onNavigate: (tab: any) => void;
}

export function DashboardScreen({ data, onRefresh, onOpenConnect, onNavigate }: DashboardScreenProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm font-medium">Loading Canadian financial overview...</p>
        </div>
      </div>
    );
  }

  const { summary, accounts, budget, recurringIncome, goals, recentTransactions, connections } = data;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 p-5 md:p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍁</span>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Welcome back, {data.user?.name || "Canadian Saver"}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synchronized with Canadian Open Banking (Flinks Connectivity Layer)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Accounts</span>
            </button>
            <button
              onClick={onOpenConnect}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Add Bank</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {/* Total Assets */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Liquid Assets</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {formatCad(summary.totalAssets)}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Chequing & Savings</span>
          </p>
        </div>

        {/* Total Liabilities */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Credit & Loans</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {formatCad(summary.totalLiabilities)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Avion & CashBack balances</p>
        </div>

        {/* Monthly Inflow */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Month Income</span>
            <ArrowUpRight className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-teal-400 tracking-tight">
            +{formatCad(summary.monthlyIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Payroll & CRA benefits</p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Month Spent</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-200 tracking-tight">
            {formatCad(summary.monthlyExpenses)}
          </div>
          <p className="text-[11px] font-medium mt-1 text-emerald-400">
            Net Cash Flow: {summary.netCashFlow >= 0 ? "+" : ""}{formatCad(summary.netCashFlow)}
          </p>
        </div>
      </div>

      {/* Main Content Layout (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Budget Utilization Widget */}
          {budget && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-teal-400" />
                    {budget.budgetName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Spent {formatCad(budget.totalSpent)} of {formatCad(budget.totalAllocated)} (
                    {budget.percentUsed}% used)
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("budget")}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300"
                >
                  Manage Budget &rarr;
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 mb-4">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    budget.percentUsed > 90
                      ? "bg-rose-500"
                      : budget.percentUsed >= 75
                      ? "bg-amber-500"
                      : "bg-teal-500"
                  }`}
                  style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
                />
              </div>

              {/* Category Breakdown Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {budget.items.slice(0, 4).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.categoryName}</span>
                      <span
                        className={`font-bold ${
                          item.isCritical ? "text-rose-400" : item.isWarning ? "text-amber-400" : "text-slate-300"
                        }`}
                      >
                        {item.percentUsed}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.isCritical ? "bg-rose-500" : item.isWarning ? "bg-amber-500" : "bg-teal-500"
                        }`}
                        style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Spent: {formatCad(item.spent)}</span>
                      <span>Left: {formatCad(item.remaining)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Normalized Transactions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Recent Synchronized Transactions</h3>
              <button
                onClick={() => onNavigate("transactions")}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300"
              >
                View All &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {recentTransactions.map((tx: any) => {
                const amt = parseFloat(tx.amount);
                const isExpense = amt < 0;
                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-950/40 px-2 rounded-xl transition cursor-pointer"
                    onClick={() => onNavigate("transactions")}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: `${tx.categoryColor}25`, color: tx.categoryColor }}
                      >
                        {tx.cleanMerchant.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-xs text-white truncate">{tx.cleanMerchant}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tx.categoryName} • {tx.accountName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold ${
                          tx.isTransfer
                            ? "text-slate-400"
                            : isExpense
                            ? "text-slate-100"
                            : "text-emerald-400"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatCad(Math.abs(amt))}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(tx.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 span) */}
        <div className="space-y-6">
          {/* Upcoming Expected Recurring Income */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Upcoming Income Cadence
              </h3>
              <button
                onClick={() => onNavigate("recurring")}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
              >
                Details
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Detected payroll & Canadian government benefits schedule
            </p>

            <div className="space-y-2.5">
              {recurringIncome.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-teal-400 capitalize">
                      {p.frequency} • {p.status === "confirmed" ? "Confirmed" : "Suggested"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-emerald-400">+{formatCad(p.expectedAmount)}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.nextExpectedDate
                        ? new Date(p.nextExpectedDate).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Expected soon"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Progress Tracking */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">Savings & Debt Goals</h3>
              <button
                onClick={() => onNavigate("goals")}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
              >
                Track All
              </button>
            </div>

            <div className="space-y-3">
              {goals.map((g: any) => (
                <div key={g.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{g.title}</span>
                    <span className="font-bold text-teal-400">{g.percentComplete}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${g.percentComplete}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Current: {formatCad(g.currentAmountNum)}</span>
                    <span>Target: {formatCad(g.targetAmountNum)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canadian Bank Connections Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Flinks Sync Status
              </h3>
              <button
                onClick={() => onNavigate("accounts")}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {connections.map((conn: any) => (
                <div
                  key={conn.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold text-white">{conn.institutionName}</p>
                      <p className="text-[10px] text-slate-400">
                        Last sync: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-400">
                    Healthy
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
