"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  FileDown,
  RefreshCw,
  Bell,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
} from "lucide-react";

interface SettingsScreenProps {
  user: any;
  onRefreshAll: () => void;
}

export function SettingsScreen({ user, onRefreshAll }: SettingsScreenProps) {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [budgetPeriod, setBudgetPeriod] = useState("monthly");
  const [payCycle, setPayCycle] = useState("biweekly");
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSimulateWebhook = async () => {
    setWebhookStatus("Simulating Flinks Webhook event callback (OPERATION_COMPLETED)...");
    try {
      const payload = {
        EventId: `evt_${Date.now()}`,
        LoginId: "flinks_login_ca_rbc_98214a",
        EventType: "OPERATION_COMPLETED",
        Accounts: [],
      };

      const res = await fetch("/api/flinks/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-flinks-signature": "sha256=test_signature_ca",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setWebhookStatus(`Webhook processed idempotently! Event ID: ${payload.EventId}`);
        onRefreshAll();
      } else {
        setWebhookStatus(`Webhook error: ${data.error}`);
      }
    } catch (e: any) {
      setWebhookStatus(`Error: ${e.message}`);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export_data" }),
      });
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MapleBudget_Canadian_Export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback("Canadian financial export downloaded successfully.");
    } catch (e: any) {
      setFeedback(`Export error: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReseedData = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_demo_data" }),
      });
      if (res.ok) {
        setFeedback("Canadian sample dataset refreshed.");
        onRefreshAll();
      }
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-400" />
          Settings & Privacy Controls
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Canadian regulatory compliance, Flinks provider configurations, and export management
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-teal-950/80 border border-teal-500/40 text-teal-200 rounded-xl text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-teal-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Profile & Localization */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          Canadian User Profile & Localization
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Name</span>
            <p className="font-bold text-white text-sm mt-0.5">{user?.name || "Alex Tremblay"}</p>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Email</span>
            <p className="font-bold text-white text-sm mt-0.5">{user?.email || "alex.tremblay@example.ca"}</p>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Default Currency</span>
            <p className="font-bold text-teal-400 text-sm mt-0.5">CAD ($ Canadian Dollar)</p>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Timezone</span>
            <p className="font-bold text-white text-sm mt-0.5">America/Toronto (Eastern)</p>
          </div>
        </div>
      </div>

      {/* Privacy and Data Protection (PIPEDA / Canada) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-400" />
          Canadian Privacy & Export Standards
        </h2>

        <p className="text-xs text-slate-400">
          In alignment with Canadian consumer financial protection and PIPEDA guidelines, your banking credentials are never exposed, and you may export or purge your financial history at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExporting ? "Generating..." : "Export Financial Data (JSON)"}</span>
          </button>
        </div>
      </div>

      {/* Developer & Flinks Diagnostic Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-teal-400" />
          Flinks Webhook & Background Worker Simulator
        </h2>

        <p className="text-xs text-slate-400">
          Simulate incoming Flinks asynchronous webhooks to verify idempotency, transaction ingestion, and duplicate filtering pipelines.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateWebhook}
              className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Simulate Flinks Webhook Event</span>
            </button>
            <button
              onClick={handleReseedData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <Database className="w-4 h-4" />
              <span>Reset Demo Seed Data</span>
            </button>
          </div>

          {webhookStatus && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-teal-300">
              {webhookStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
