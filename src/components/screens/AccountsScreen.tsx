"use client";

import { useState } from "react";
import {
  Wallet,
  Building2,
  RefreshCw,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { formatCad, formatDate } from "@/lib/utils";

interface AccountsScreenProps {
  accounts: any[];
  connections: any[];
  onRefreshAll: () => void;
  onOpenConnect: () => void;
}

export function AccountsScreen({ accounts, connections, onRefreshAll, onOpenConnect }: AccountsScreenProps) {
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualType, setManualType] = useState("cash");
  const [manualBalance, setManualBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRefreshConnection = async (connectionId: string, instName: string) => {
    try {
      setRefreshingId(connectionId);
      const res = await fetch(`/api/connections/${connectionId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`Refreshed ${instName}: ${data.result.addedCount} new transactions synced.`);
        onRefreshAll();
      } else {
        setFeedback(`Failed to refresh: ${data.error}`);
      }
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setRefreshingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this Canadian institution? Synchronized accounts will be removed.")) {
      return;
    }
    try {
      const res = await fetch(`/api/connections/${connectionId}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback("Institution disconnected successfully.");
        onRefreshAll();
      }
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  const handleCreateManualAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualBalance) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          type: manualType,
          currentBalance: manualBalance,
          currency: "CAD",
        }),
      });
      if (res.ok) {
        setShowManualModal(false);
        setManualName("");
        setManualBalance("");
        onRefreshAll();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-400" />
            Connected Accounts & Banks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated Canadian financial institutions synchronized via Flinks Open Banking API
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Account</span>
          </button>
          <button
            onClick={onOpenConnect}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-950/50 transition"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Link Institution</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-teal-950/80 border border-teal-500/40 text-teal-200 rounded-xl text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-teal-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Connected Financial Institutions Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Flinks Financial Institutions ({connections.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((conn) => {
            const isRefreshing = refreshingId === conn.id;
            const instAccounts = accounts.filter((a) => a.connectionId === conn.id);

            return (
              <div
                key={conn.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow"
                      style={{ backgroundColor: conn.institution?.primaryColor || "#0f766e" }}
                    >
                      {conn.institution?.shortName?.slice(0, 3) || "BNK"}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{conn.institutionName}</h3>
                      <p className="text-[11px] text-slate-400">
                        Login ID: <span className="font-mono">{conn.flinksLoginId.slice(0, 16)}...</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {conn.status}
                  </span>
                </div>

                {/* Sub-accounts under this institution */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  {instAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">{acc.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {acc.type.replace("_", " ")} ••••{acc.accountNumberMask}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-xs font-bold ${
                            acc.type === "credit_card" ? "text-rose-400" : "text-white"
                          }`}
                        >
                          {formatCad(acc.currentBalance)}
                        </p>
                        {acc.availableBalance && (
                          <p className="text-[10px] text-slate-500">
                            Avail: {formatCad(acc.availableBalance)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Institution Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-500">
                    Synced: {conn.lastSyncAt ? formatDate(conn.lastSyncAt) : "Never"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRefreshConnection(conn.id, conn.institutionName)}
                      disabled={isRefreshing}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition"
                      title="Refresh Institution"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                      title="Disconnect Institution"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Accounts Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Manual & Offline Accounts
        </h2>

        {accounts.filter((a) => a.isManual).length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center space-y-2">
            <p className="text-xs text-slate-400">No manual accounts added yet.</p>
            <button
              onClick={() => setShowManualModal(true)}
              className="text-xs font-bold text-teal-400 hover:text-teal-300"
            >
              + Add Cash or Private Debt Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts
              .filter((a) => a.isManual)
              .map((acc) => (
                <div
                  key={acc.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white">{acc.name}</h4>
                      <p className="text-[10px] text-slate-400 capitalize">{acc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{formatCad(acc.currentBalance)}</p>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                      Manual
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Manual Account Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Add Manual Canadian Account</h3>
            <form onSubmit={handleCreateManualAccount} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tangerine GIC / Cash Wallet"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Account Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="cash">Cash / Physical Wallet</option>
                  <option value="savings">High-Interest Savings / GIC</option>
                  <option value="chequing">Chequing Account</option>
                  <option value="manual_debt">Personal Loan / Debt</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Current Balance ($ CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={manualBalance}
                  onChange={(e) => setManualBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  {isSubmitting ? "Saving..." : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
