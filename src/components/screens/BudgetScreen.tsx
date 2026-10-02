"use client";

import { useState, useEffect } from "react";
import {
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { formatCad } from "@/lib/utils";

export function BudgetScreen() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/budgets");
      const data = await res.json();
      if (data.budgets) {
        setBudgets(data.budgets);
      }
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (budget: any) => {
    setEditingBudget(budget);
    const map: Record<string, string> = {};
    budget.items.forEach((item: any) => {
      map[item.categoryId] = item.allocated.toString();
    });
    setAllocations(map);
  };

  const handleSaveAllocations = async () => {
    if (!editingBudget) return;
    setSaving(true);
    try {
      const itemsPayload = Object.entries(allocations).map(([catId, amount]) => {
        const existingItem = editingBudget.items.find((i: any) => i.categoryId === catId);
        return {
          id: existingItem?.id,
          categoryId: catId,
          allocatedAmount: amount || "0",
        };
      });

      const res = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        setEditingBudget(null);
        fetchBudgets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">Loading Canadian budget periods...</div>
    );
  }

  const current = budgets[selectedBudgetIndex];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-teal-400" />
            Category Budgeting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Allocate Canadian dollar spending targets, monitor threshold warnings (75%, 90%), and eliminate leaks
          </p>
        </div>

        {current && (
          <button
            onClick={() => handleOpenEdit(current)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 transition self-start sm:self-auto"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Allocations</span>
          </button>
        )}
      </div>

      {current && (
        <>
          {/* Budget Overview Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">{current.name}</h2>
                <p className="text-xs text-slate-400">
                  {new Date(current.startDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })} -{" "}
                  {new Date(current.endDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Total Utilization:</span>
                <span
                  className={`text-base font-extrabold ${
                    current.utilization > 90
                      ? "text-rose-400"
                      : current.utilization >= 75
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {current.utilization}%
                </span>
              </div>
            </div>

            {/* Main Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  current.utilization > 90
                    ? "bg-rose-500"
                    : current.utilization >= 75
                    ? "bg-amber-500"
                    : "bg-teal-500"
                }`}
                style={{ width: `${Math.min(100, current.utilization)}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Target</p>
                <p className="text-sm md:text-base font-bold text-white mt-0.5">
                  {formatCad(current.totalAllocated)}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Actual Spent</p>
                <p className="text-sm md:text-base font-bold text-rose-300 mt-0.5">
                  {formatCad(current.totalSpent)}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Remaining Safe</p>
                <p className="text-sm md:text-base font-bold text-emerald-400 mt-0.5">
                  {formatCad(current.remaining)}
                </p>
              </div>
            </div>
          </div>

          {/* Category-Level Budget Allocations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Category Breakdown & Warnings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {current.items.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-xs text-white">{item.categoryName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status === "exceeded" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800/60 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Over Budget
                        </span>
                      )}
                      {item.status === "critical" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800/60 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> &gt;90% Used
                        </span>
                      )}
                      {item.status === "warning" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-800/40 rounded-full">
                          &gt;75% Used
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-300">{item.utilization}%</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "exceeded" || item.status === "critical"
                          ? "bg-rose-500"
                          : item.status === "warning"
                          ? "bg-amber-500"
                          : "bg-teal-500"
                      }`}
                      style={{ width: `${Math.min(100, item.utilization)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>
                      Spent: <strong className="text-slate-200">{formatCad(item.spent)}</strong>
                    </span>
                    <span>
                      Budget: <strong className="text-slate-200">{formatCad(item.allocated)}</strong>
                    </span>
                    <span>
                      Left:{" "}
                      <strong
                        className={item.remaining < 0 ? "text-rose-400" : "text-emerald-400"}
                      >
                        {formatCad(item.remaining)}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Edit Allocations Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="font-bold text-white text-base">Edit Budget Allocations ($ CAD)</h3>
            <p className="text-xs text-slate-400">
              Set planned spending amounts per Canadian budgeting category.
            </p>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {categories
                .filter((c) => !c.isExcludedFromBudget && c.id !== "income")
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-semibold text-white">{cat.name}</span>
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        step="10"
                        placeholder="0.00"
                        value={allocations[cat.id] ?? ""}
                        onChange={(e) =>
                          setAllocations({
                            ...allocations,
                            [cat.id]: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-right text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAllocations}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow"
              >
                {saving ? "Saving..." : "Save Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
