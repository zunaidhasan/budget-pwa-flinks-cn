"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Building2, ExternalLink } from "lucide-react";

interface Institution {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  logoUrl?: string;
  supportedProducts?: string[];
  isPopular?: boolean;
}

interface FlinksConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FlinksConnectModal({ isOpen, onClose, onSuccess }: FlinksConnectModalProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [step, setStep] = useState<"select" | "connecting" | "success" | "error">("select");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusLog, setStatusLog] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedInst(null);
      setErrorMsg("");
      setStatusLog([]);
      fetchInstitutions();
    }
  }, [isOpen]);

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/flinks/session");
      const data = await res.json();
      if (data.institutions) {
        setInstitutions(data.institutions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectInstitution = (inst: Institution) => {
    setSelectedInst(inst);
  };

  const handleConnectInstitution = async () => {
    if (!selectedInst) return;
    setStep("connecting");
    setLoading(true);
    setStatusLog([
      `Initializing secure Flinks Connect session for ${selectedInst.name}...`,
      "Enforcing Canadian TLS 1.3 encrypted data tunnel...",
    ]);

    try {
      // Step 1: Initialize session
      await new Promise((r) => setTimeout(r, 600));
      setStatusLog((prev) => [...prev, "Authenticating with Canadian banking gateway..."]);

      const sessionRes = await fetch("/api/flinks/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: selectedInst.id,
          simulateSync: true,
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || "Flinks connection handshake failed");
      }

      await new Promise((r) => setTimeout(r, 800));
      setStatusLog((prev) => [
        ...prev,
        "Retrieving account balances (Chequing, Savings, Credit)...",
        "Normalizing CAD transactions and cleaning merchant descriptors...",
        "Applying duplicate-prevention fingerprints...",
        "Analyzing payroll cadence and recurring income...",
      ]);

      await new Promise((r) => setTimeout(r, 600));
      setStatusLog((prev) => [...prev, `Successfully linked ${selectedInst.name} accounts!`]);

      setStep("success");
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to link institution");
      setStep("error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                Connect Canadian Bank
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-950 border border-teal-700/50 text-teal-300 rounded-full">
                  Flinks Connect
                </span>
              </h3>
              <p className="text-xs text-slate-400">Bank-grade 256-bit encryption. Credentials never stored.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === "select" && (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Search Canadian bank (RBC, TD, Scotia, BMO...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Financial Institution
                </p>
                <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filtered.map((inst) => {
                    const isSelected = selectedInst?.id === inst.id;
                    return (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => handleSelectInstitution(inst)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? "bg-teal-950/40 border-teal-500 shadow-sm ring-1 ring-teal-500 text-white"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-200"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow"
                          style={{ backgroundColor: inst.primaryColor }}
                        >
                          {inst.shortName.slice(0, 3)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-xs truncate">{inst.shortName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{inst.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedInst && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedInst.primaryColor }}
                    />
                    <span className="text-xs font-medium text-slate-200">
                      Ready to link: <strong>{selectedInst.name}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-400 font-medium">Ready</span>
                </div>
              )}

              {/* Flinks Security Notice */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-teal-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Canadian Banking Privacy Standards</span>
                </div>
                <p>
                  MapleBudget uses Flinks financial connectivity. Your banking passwords and security questions are entered exclusively on the provider's secure page and are never seen or stored on our servers.
                </p>
              </div>
            </div>
          )}

          {step === "connecting" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 animate-spin">
                  <RefreshCw className="w-8 h-8" />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base text-white">Connecting with Flinks</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Synchronizing accounts & transactions for {selectedInst?.name}...
                </p>
              </div>

              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] text-teal-300/90 max-h-40 overflow-y-auto space-y-1">
                {statusLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-white">Institution Connected!</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">
                  {selectedInst?.name} accounts and transactions were successfully retrieved and normalized. Your dashboard and budget allocations are updated.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left w-full text-xs space-y-1 text-slate-300">
                <p><strong>Institution:</strong> {selectedInst?.name}</p>
                <p><strong>Provider:</strong> Flinks Connect (Canada)</p>
                <p><strong>Sync Status:</strong> Healthy (Accounts, Balances & Transactions Active)</p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-white">Connection Interrupted</h4>
              <p className="text-xs text-rose-300">{errorMsg || "An error occurred during Flinks authentication."}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {step === "select" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedInst}
                onClick={handleConnectInstitution}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedInst
                    ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                Launch Flinks Connect
              </button>
            </>
          )}

          {step === "connecting" && (
            <div className="w-full text-center text-xs text-slate-400">
              Please do not close this window while the financial sync is in progress...
            </div>
          )}

          {step === "success" && (
            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-teal-900/40"
            >
              Done & View Accounts
            </button>
          )}

          {step === "error" && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("select")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
