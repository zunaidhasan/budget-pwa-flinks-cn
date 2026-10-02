"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Tag,
  Edit2,
  Check,
  X,
  FileDown,
} from "lucide-react";
import { formatCad, formatDate } from "@/lib/utils";

interface TransactionsScreenProps {
  accounts: any[];
}

export function TransactionsScreen({ accounts }: TransactionsScreenProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Edit category modal state
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editIsTransfer, setEditIsTransfer] = useState(false);
  const [alwaysRule, setAlwaysRule] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Manual transaction modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccId, setNewAccId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newCatId, setNewCatId] = useState("groceries");

  useEffect(() => {
    fetchTransactions();
  }, [search, selectedCategory, selectedAccount, selectedType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedAccount !== "all") params.set("accountId", selectedAccount);
      if (selectedType !== "all") params.set("type", selectedType);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
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

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx);
    setEditCategoryId(tx.categoryId);
    setEditNotes(tx.notes || "");
    setEditIsTransfer(tx.isTransfer);
    setAlwaysRule(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editCategoryId,
          notes: editNotes,
          isTransfer: editIsTransfer,
          createMerchantRule: alwaysRule,
        }),
      });
      if (res.ok) {
        setEditingTx(null);
        fetchTransactions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccId || !newAmount || !newDesc) return;
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: newAccId,
          amount: newAmount,
          description: newDesc,
          cleanMerchant: newMerchant || newDesc,
          categoryId: newCatId,
          date: newDate,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewDesc("");
        setNewMerchant("");
        setNewAmount("");
        fetchTransactions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-teal-400" />
            Transactions & Categorization
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Normalized Canadian banking records with automated merchant classification and user overrides
          </p>
        </div>

        <button
          onClick={() => {
            if (accounts.length > 0) setNewAccId(accounts[0].id);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-950/50 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, description, notes (e.g. Loblaws, Tim Hortons, Payroll)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading Canadian transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transactions found matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {transactions.map((tx) => {
              const amt = parseFloat(tx.amount);
              const isExpense = amt < 0;
              return (
                <div
                  key={tx.id}
                  onClick={() => handleOpenEdit(tx)}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-950/60 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: `${tx.categoryColor}20`, color: tx.categoryColor }}
                    >
                      {tx.cleanMerchant ? tx.cleanMerchant.slice(0, 2).toUpperCase() : "TX"}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs text-white truncate">{tx.cleanMerchant}</p>
                        {tx.userCategorized && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-teal-950 text-teal-400 border border-teal-800/50 rounded">
                            Rule/Edited
                          </span>
                        )}
                        {tx.isTransfer && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                            Transfer
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {tx.categoryName} • {tx.accountName} •{" "}
                        <span className="text-slate-500 font-mono text-[10px]">{tx.description}</span>
                      </p>
                      {tx.notes && <p className="text-[10px] text-teal-300 italic truncate mt-0.5">"{tx.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
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
                      <p className="text-[10px] text-slate-500">{formatDate(tx.date)}</p>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-500 group-hover:text-teal-400 group-hover:bg-slate-800 transition"
                      title="Edit Category or Notes"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Category & Rule Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Edit Transaction</h3>
                <p className="text-xs text-slate-400 font-mono truncate">{editingTx.description}</p>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Budget Category</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">User Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Split cottage rent with Emily"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editIsTransfer}
                    onChange={(e) => setEditIsTransfer(e.target.checked)}
                    className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Mark as internal account transfer (exclude from spending reports)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-teal-300 font-medium">
                  <input
                    type="checkbox"
                    checked={alwaysRule}
                    onChange={(e) => setAlwaysRule(e.target.checked)}
                    className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    Always categorize <strong>"{editingTx.cleanMerchant}"</strong> to this category
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow"
              >
                {savingEdit ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add Transaction Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Account</label>
                <select
                  value={newAccId}
                  onChange={(e) => setNewAccId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCad(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Amount in CAD (negative for expense, positive for income)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="-45.50 or 2500.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Merchant / Payor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sobeys / Farm Boy"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery purchase debit"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Category</label>
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Date</label>
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
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
