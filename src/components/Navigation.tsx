"use client";

import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  CalendarCheck2,
  Target,
  Settings,
  Bell,
  Building2,
  PlusCircle,
} from "lucide-react";

export type NavTab = "dashboard" | "accounts" | "transactions" | "budget" | "recurring" | "goals" | "settings" | "notifications";

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount?: number;
  onOpenConnect: () => void;
}

export function Navigation({ currentTab, onTabChange, unreadCount = 0, onOpenConnect }: NavigationProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "Accounts", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "budget", label: "Budget", icon: PiggyBank },
    { id: "recurring", label: "Income", icon: CalendarCheck2 },
    { id: "goals", label: "Goals", icon: Target },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <>
      {/* Top Desktop & Tablet Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange("dashboard")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-teal-900/30 text-white font-black text-lg">
              🍁
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">MapleBudget</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-red-950/80 border border-red-700/60 text-red-300 rounded">
                  CAD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Flinks Canadian Bank Sync</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as NavTab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-800 text-teal-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Header Items */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("notifications")}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenConnect}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-teal-950/50 transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect Bank (Flinks)</span>
              <span className="sm:hidden">Connect</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (PWA standard) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as NavTab)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition ${
                  isActive ? "text-teal-400" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? "bg-teal-500/15" : ""}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="mt-0.5">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => onTabChange("goals")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition ${
              currentTab === "goals" ? "text-teal-400" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <div className={`p-1 rounded-lg ${currentTab === "goals" ? "bg-teal-500/15" : ""}`}>
              <Target className="w-4 h-4" />
            </div>
            <span className="mt-0.5">Goals</span>
          </button>
        </div>
      </div>
    </>
  );
}
