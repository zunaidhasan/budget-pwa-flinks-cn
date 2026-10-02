"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/all/read", { method: "PATCH" });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-400" />
            Notifications & Banking Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications for synchronization health, budget thresholds, and anticipated payroll deposits
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading alerts...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
          No notifications at this time. All Canadian connections are healthy!
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isRead = n.isRead;
            return (
              <div
                key={n.id}
                onClick={() => !isRead && handleMarkOneRead(n.id)}
                className={`p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                  isRead
                    ? "bg-slate-900/60 border-slate-800/80 text-slate-400"
                    : "bg-slate-900 border-teal-500/30 shadow-md shadow-teal-950/20 text-white cursor-pointer"
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-800 shrink-0 mt-0.5">
                  {n.type === "sync_alert" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {n.type === "budget_warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {n.type === "income_incoming" && <Calendar className="w-4 h-4 text-teal-400" />}
                  {!["sync_alert", "budget_warning", "income_incoming"].includes(n.type) && (
                    <Bell className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs font-bold ${isRead ? "text-slate-300" : "text-white"}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
