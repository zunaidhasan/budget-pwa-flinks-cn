"use client";

import { useState, useEffect } from "react";
import { Navigation, NavTab } from "@/components/Navigation";
import { FlinksConnectModal } from "@/components/FlinksConnectModal";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { AccountsScreen } from "@/components/screens/AccountsScreen";
import { TransactionsScreen } from "@/components/screens/TransactionsScreen";
import { BudgetScreen } from "@/components/screens/BudgetScreen";
import { RecurringIncomeScreen } from "@/components/screens/RecurringIncomeScreen";
import { GoalsScreen } from "@/components/screens/GoalsScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { NotificationsScreen } from "@/components/screens/NotificationsScreen";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        unreadCount={dashboardData?.summary?.unreadNotifications || 0}
        onOpenConnect={() => setIsConnectOpen(true)}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === "dashboard" && (
          <DashboardScreen
            data={dashboardData}
            onRefresh={fetchDashboardData}
            onOpenConnect={() => setIsConnectOpen(true)}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === "accounts" && (
          <AccountsScreen
            accounts={dashboardData?.accounts || []}
            connections={dashboardData?.connections || []}
            onRefreshAll={fetchDashboardData}
            onOpenConnect={() => setIsConnectOpen(true)}
          />
        )}

        {currentTab === "transactions" && (
          <TransactionsScreen accounts={dashboardData?.accounts || []} />
        )}

        {currentTab === "budget" && <BudgetScreen />}

        {currentTab === "recurring" && <RecurringIncomeScreen />}

        {currentTab === "goals" && (
          <GoalsScreen accounts={dashboardData?.accounts || []} />
        )}

        {currentTab === "settings" && (
          <SettingsScreen
            user={dashboardData?.user}
            onRefreshAll={fetchDashboardData}
          />
        )}

        {currentTab === "notifications" && <NotificationsScreen />}
      </main>

      {/* Flinks Bank Connect Modal */}
      <FlinksConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
