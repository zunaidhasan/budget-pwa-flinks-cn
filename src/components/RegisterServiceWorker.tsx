"use client";

import { useEffect, useState } from "react";
import { WifiOff, Download } from "lucide-react";

export function RegisterServiceWorker() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // 1. Service Worker registration
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.warn("SW registration error:", err));
    }

    // 2. Online / Offline status listener
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    setIsOffline(!navigator.onLine);

    // 3. Install prompt listener for PWA
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {isOffline && (
        <div className="bg-amber-600/90 backdrop-blur-md text-amber-50 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>
              <strong>Offline Mode:</strong> Live bank sync paused. Stale balances are not shown to protect financial accuracy.
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-amber-800/80 hover:bg-amber-800 px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {canInstall && (
        <div className="bg-slate-900/95 border-b border-teal-500/30 text-slate-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400"></span>
            <span>Install MapleBudget PWA on your device for fast Canadian banking overview</span>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-medium px-2.5 py-1 rounded shadow text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </button>
        </div>
      )}
    </>
  );
}
