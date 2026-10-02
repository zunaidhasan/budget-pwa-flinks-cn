"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck2,
  Check,
  X,
  Edit2,
  Clock,
  Sparkles,
  Plus,
  HelpCircle,
  Building2,
} from "lucide-react";
import { formatCad, formatDate } from "@/lib/utils";

export function RecurringIncomeScreen() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New manual income source state
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newFrequency, setNewFrequency] = useState("biweekly");
  const [newCategory, setNewCategory] = useState("payroll");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recurring-income");
      const data = await res.json();
      if (data.patterns) setPatterns(data.patterns);
      if (data.sources) setSources(data.sources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "confirmed" | "rejected") => {
    try {
      const res = await fetch(`/api/recurring-income/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchRecurring();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddManualSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount) return;
    try {
      const res = await fetch("/api/recurring-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          amount: newAmount,
          frequency: newFrequency,
          category: newCategory,
          nextExpectedDate: newDate || undefined,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewName("");
        setNewAmount("");
        fetchRecurring();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Analyzing recurring income cadences...</div>;
  }

  const suggested = patterns.filter((p) => p.status === "suggested");
  const confirmed = patterns.filter((p) => p.status === "confirmed" || p.status === "manual");

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-teal-400" />
            Recurring Income Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic detection of Canadian bi-weekly payroll, government credits (CRA CCB, GST/HST), and pensions
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-950/50 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Income Source</span>
        </button>
      </div>

      {/* Suggested Patterns Requiring Confirmation */}
      {suggested.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Needs Confirmation ({suggested.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggested.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg shadow-amber-950/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{item.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Merchant match: <span className="font-mono text-slate-300">{item.merchantMatch}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300">
                    {Math.round(parseFloat(item.confidenceScore) * 100)}% Confidence
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-bold text-emerald-400">+{formatCad(item.expectedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Detected Cadence:</span>
                    <span className="font-semibold text-slate-200 capitalize">{item.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Predicted Date:</span>
                    <span className="font-semibold text-slate-200">{formatDate(item.nextExpectedDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStatus(item.id, "rejected")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Not Recurring</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, "confirmed")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Income</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Recurring Income Sources */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Active Recurring Income Schedule ({confirmed.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {confirmed.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                  <p className="text-xs text-teal-400 capitalize font-medium">
                    {item.frequency} schedule • {item.accountName || "RBC Chequing"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-400">
                    +{formatCad(item.expectedAmount)}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400">
                    Confirmed
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Next Arrival:</span>
                </div>
                <strong className="text-white">{formatDate(item.nextExpectedDate)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Manual Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Add Recurring Income Source</h3>
            <form onSubmit={handleAddManualSource} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Source Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Consulting Retainer / CPP Pension"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Expected Amount ($ CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2400.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="weekly">Weekly (Every 7 days)</option>
                  <option value="biweekly">Bi-weekly (Every 14 days - common Canadian payroll)</option>
                  <option value="semimonthly">Semi-monthly (15th and end of month)</option>
                  <option value="monthly">Monthly (1st of month)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="payroll">Primary Employment Payroll</option>
                  <option value="government_benefit">Canadian Government Benefit (CCB / GST)</option>
                  <option value="pension">Pension / CPP / OAS</option>
                  <option value="freelance">Freelance / Contract</option>
                  <option value="rental">Rental Income</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Next Expected Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
