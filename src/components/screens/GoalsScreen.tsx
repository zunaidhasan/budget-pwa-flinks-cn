"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Calendar,
  PiggyBank,
  PlusCircle,
  X,
  Sparkles,
} from "lucide-react";
import { formatCad, formatDate } from "@/lib/utils";

interface GoalsScreenProps {
  accounts: any[];
}

export function GoalsScreen({ accounts }: GoalsScreenProps) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contribGoal, setContribGoal] = useState<any | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");

  // New goal state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("emergency_fund");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (data.goals) setGoals(data.goals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          targetAmount,
          currentAmount: currentAmount || "0",
          targetDate: targetDate || undefined,
          linkedAccountId: linkedAccountId || undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setTitle("");
        setTargetAmount("");
        setCurrentAmount("");
        fetchGoals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribGoal || !contribAmount) return;
    try {
      const res = await fetch(`/api/goals/${contribGoal.id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: contribAmount,
          note: contribNote,
        }),
      });
      if (res.ok) {
        setContribGoal(null);
        setContribAmount("");
        setContribNote("");
        fetchGoals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading Canadian financial goals...</div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-teal-400" />
            Financial Goals & Milestones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track emergency funds, down payments, debt elimination, and vacation savings
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-950/50 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const isDone = g.percentComplete >= 100;
          return (
            <div
              key={g.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{g.title}</h3>
                  <p className="text-xs text-slate-400 capitalize">
                    {g.type.replace("_", " ")}
                    {g.linkedAccountName ? ` • ${g.linkedAccountName}` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      isDone
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-700"
                        : "bg-teal-950 text-teal-300 border border-teal-800/60"
                    }`}
                  >
                    {g.percentComplete}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDone
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-teal-500 to-emerald-500"
                  }`}
                  style={{ width: `${g.percentComplete}%` }}
                />
              </div>

              {/* Balances */}
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Current Saved:</span>
                  <p className="font-bold text-white text-sm">{formatCad(g.currentAmountNum)}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Target Goal:</span>
                  <p className="font-bold text-slate-200 text-sm">{formatCad(g.targetAmountNum)}</p>
                </div>
              </div>

              {/* Monthly Contribution Recommendation */}
              {!isDone && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Monthly Needed:</span>
                  <span className="font-extrabold text-teal-400">
                    {formatCad(g.neededPerMonth)} / mo
                  </span>
                </div>
              )}

              {g.notes && <p className="text-[11px] text-slate-400 italic">"{g.notes}"</p>}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Target Date: {g.targetDate ? formatDate(g.targetDate) : "Flexible"}
                </span>

                <button
                  onClick={() => setContribGoal(g)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Contribution</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Contribution Modal */}
      {contribGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Add Contribution to {contribGoal.title}</h3>
            <form onSubmit={handleAddContribution} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Amount ($ CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="250.00"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly transfer from chequing"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setContribGoal(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Confirm Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Create Financial Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whistler Ski Trip / TFSA Max"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="vacation">Vacation Fund</option>
                  <option value="home_deposit">Home Down Payment</option>
                  <option value="car">Vehicle Purchase</option>
                  <option value="debt_payoff">Credit Card / Debt Payoff</option>
                  <option value="general_savings">General Savings Target</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Target Amount ($ CAD)</label>
                <input
                  type="number"
                  step="10"
                  required
                  placeholder="5000.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Starting Amount ($ CAD)</label>
                <input
                  type="number"
                  step="10"
                  placeholder="0.00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Linked Account</label>
                <select
                  value={linkedAccountId}
                  onChange={(e) => setLinkedAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">None (General Target)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
